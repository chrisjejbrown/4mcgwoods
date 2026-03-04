#!/usr/bin/env python3
"""
Convert EDS .plain.html files to JCR .content.xml for AEM Cloud Service xwalk import.
Supports Universal Editor block models and structured content.
"""

import os
import sys
import json
import re
import shutil
import zipfile
from bs4 import BeautifulSoup, Comment, Tag

# === Configuration ===
WORKSPACE = '/workspace'
CONTENT_DIR = os.path.join(WORKSPACE, 'content')
PACKAGE_DIR = os.path.join(WORKSPACE, 'package')
JCR_BASE = os.path.join(PACKAGE_DIR, 'jcr_root', 'content', 'mcguire-woods')
OUTPUT_ZIP = os.path.join(WORKSPACE, 'mcguire-woods-content-6.0.0.zip')

# AEM Resource Types
RT_PAGE = 'core/franklin/components/page/v1/page'
RT_SECTION = 'core/franklin/components/section/v1/section'
RT_BLOCK = 'core/franklin/components/block/v1/block'
RT_BLOCK_ITEM = 'core/franklin/components/block/v1/block/item'
RT_TEXT = 'core/franklin/components/text/v1/text'
RT_TITLE = 'core/franklin/components/title/v1/title'
RT_IMAGE = 'core/franklin/components/image/v1/image'
RT_BUTTON = 'core/franklin/components/button/v1/button'
RT_COLUMNS = 'core/franklin/components/columns/v1/columns'

HEADING_TAGS = {'h1', 'h2', 'h3', 'h4', 'h5', 'h6'}

# Global registries
BLOCK_DEFS = {}
BLOCK_MODELS = {}
CONTAINER_FILTERS = {}


# ============================================================
# XML Utilities
# ============================================================

def xml_attr_escape(s):
    """Escape string for use as XML attribute value."""
    if s is None:
        return ''
    s = str(s)
    return (s.replace('&', '&amp;')
             .replace('<', '&lt;')
             .replace('>', '&gt;')
             .replace('"', '&quot;'))


def make_jcr_name(name):
    """Convert a string to a valid JCR node name."""
    return re.sub(r'[^a-zA-Z0-9_-]', '_', name)


def format_block_display_name(block_name):
    """Convert block-name to Block Name display format."""
    return ' '.join(word.capitalize() for word in block_name.split('-'))


# ============================================================
# Component Definition Loaders
# ============================================================

def load_definitions():
    """Load component definitions, models, and filters."""
    global BLOCK_DEFS, BLOCK_MODELS, CONTAINER_FILTERS

    # Load component definitions
    with open(os.path.join(WORKSPACE, 'component-definition.json')) as f:
        def_data = json.load(f)

    for group in def_data.get('groups', []):
        for comp in group.get('components', []):
            comp_id = comp['id']
            xwalk = comp.get('plugins', {}).get('xwalk', {}).get('page', {})
            template = xwalk.get('template', {})
            res_type = xwalk.get('resourceType', '')

            info = {
                'id': comp_id,
                'title': comp['title'],
                'resourceType': res_type,
                'template': template,
                'isItem': res_type == RT_BLOCK_ITEM,
                'isBlock': res_type == RT_BLOCK,
                'isColumns': 'columns' in res_type,
            }

            # Keep blocks / columns; skip pure item definitions for the
            # BLOCK_DEFS lookup (items are resolved via filters).
            if not info['isItem']:
                BLOCK_DEFS[comp_id] = info
            # Also store items so we can look them up
            if info['isItem']:
                BLOCK_DEFS[comp_id] = info

    # Load component models
    with open(os.path.join(WORKSPACE, 'component-models.json')) as f:
        models_data = json.load(f)
    for model in models_data:
        model_id = model['id']
        if model_id not in BLOCK_MODELS:
            BLOCK_MODELS[model_id] = model

    # Load component filters
    with open(os.path.join(WORKSPACE, 'component-filters.json')) as f:
        filters_data = json.load(f)
    for filt in filters_data:
        CONTAINER_FILTERS[filt['id']] = filt.get('components', [])


def is_container_block(block_name):
    if block_name not in BLOCK_DEFS:
        return False
    template = BLOCK_DEFS[block_name].get('template', {})
    return 'filter' in template


def get_block_model_id(block_name):
    if block_name not in BLOCK_DEFS:
        return None
    return BLOCK_DEFS[block_name].get('template', {}).get('model')


def get_block_filter_id(block_name):
    if block_name not in BLOCK_DEFS:
        return None
    return BLOCK_DEFS[block_name].get('template', {}).get('filter')


def get_item_model_id(block_name):
    filter_id = get_block_filter_id(block_name)
    if not filter_id or filter_id not in CONTAINER_FILTERS:
        return None
    item_components = CONTAINER_FILTERS[filter_id]
    if not item_components:
        return None
    item_comp_id = item_components[0]
    if item_comp_id in BLOCK_DEFS:
        return BLOCK_DEFS[item_comp_id].get('template', {}).get('model')
    return None


def get_item_display_name(block_name):
    filter_id = get_block_filter_id(block_name)
    if not filter_id or filter_id not in CONTAINER_FILTERS:
        return 'Item'
    item_components = CONTAINER_FILTERS[filter_id]
    if not item_components:
        return 'Item'
    item_comp_id = item_components[0]
    if item_comp_id in BLOCK_DEFS:
        return BLOCK_DEFS[item_comp_id].get('template', {}).get('name', 'Item')
    return 'Item'


def get_model_fields(model_id):
    if not model_id or model_id not in BLOCK_MODELS:
        return []
    return BLOCK_MODELS[model_id].get('fields', [])


def get_known_block_names():
    names = set()
    for block_id, info in BLOCK_DEFS.items():
        if info.get('isBlock') or info.get('isColumns'):
            names.add(block_id)
    names.add('section-metadata')
    names.add('metadata')
    return names


# ============================================================
# HTML Helpers
# ============================================================

def get_block_class(element):
    if not isinstance(element, Tag) or element.name != 'div':
        return None
    classes = element.get('class', [])
    if isinstance(classes, str):
        return classes
    if isinstance(classes, list) and len(classes) >= 1:
        return classes[0]
    return None


def is_block_element(element, known_blocks):
    cls = get_block_class(element)
    return cls in known_blocks if cls else False


def extract_img_data(element):
    img = element.find('img') if isinstance(element, Tag) else None
    if img:
        return img.get('src', ''), img.get('alt', '')
    return None, None


def extract_link_data(element):
    link = element.find('a') if isinstance(element, Tag) else None
    if link:
        return link.get('href', ''), link.get_text(strip=True)
    return None, None


def get_inner_html(element):
    if isinstance(element, Tag):
        return ''.join(str(c) for c in element.children).strip()
    return str(element).strip()


def get_text_content(element):
    if isinstance(element, Tag):
        return element.get_text(strip=True)
    return str(element).strip()


# ============================================================
# Field Extraction
# ============================================================

def find_field_hints(element):
    """Return {field_name: cell_element} for all <!-- field:xxx --> in element."""
    hints = {}
    for comment in element.find_all(string=lambda t: isinstance(t, Comment)):
        match = re.match(r'\s*field:(\S+)\s*', str(comment))
        if match:
            field_name = match.group(1)
            cell = comment.parent
            hints[field_name] = cell
    return hints


def extract_field_value(cell, field_name, field_def):
    """Extract a single field value based on its component type."""
    comp = field_def.get('component', 'text')

    if comp == 'reference':
        img_src, _ = extract_img_data(cell)
        if img_src:
            return img_src
        link_href, _ = extract_link_data(cell)
        if link_href:
            return link_href
        return ''

    elif comp == 'richtext':
        parts = []
        found = False
        for child in cell.children:
            if isinstance(child, Comment) and f'field:{field_name}' in str(child):
                found = True
                continue
            if found:
                parts.append(str(child))
        if parts:
            return ''.join(parts).strip()
        return ''.join(str(c) for c in cell.children
                       if not isinstance(c, Comment)).strip()

    elif comp == 'text':
        # For fields named like "link", "uri", "href" – extract URL
        if any(kw in field_name.lower() for kw in ('link', 'uri', 'href', 'url')):
            link_href, _ = extract_link_data(cell)
            if link_href:
                return link_href
        return get_text_content(cell)

    elif comp == 'aem-content':
        link_href, _ = extract_link_data(cell)
        if link_href:
            return link_href
        return get_text_content(cell)

    return get_text_content(cell)


def extract_collapsed_field(cell, field_name, field_def):
    """Extract a collapsed field (Alt, Type, Title, Text suffix)."""
    if field_name.endswith('Alt'):
        _, alt = extract_img_data(cell)
        return alt or ''
    elif field_name.endswith('Type'):
        for tag in HEADING_TAGS:
            heading = cell.find(tag)
            if heading:
                return tag
        return ''
    elif field_name.endswith('Title'):
        link = cell.find('a')
        if link:
            return link.get('title', link.get_text(strip=True))
        return ''
    elif field_name.endswith('Text'):
        link = cell.find('a')
        if link:
            return link.get_text(strip=True)
        return ''
    return ''


def _resolve_parent_field(field_name):
    """For a collapsed field like imageAlt, return (base_field, suffix)."""
    for suffix in ['Alt', 'Title', 'Type', 'MimeType', 'Text']:
        if field_name.endswith(suffix) and len(field_name) > len(suffix):
            return field_name[:-len(suffix)], suffix
    return None, None


def extract_fields_for_model(element, model_id):
    """Generic field extraction: works for simple blocks and container items."""
    fields = get_model_fields(model_id)
    if not fields:
        return {}

    hints = find_field_hints(element)
    result = {}

    # Build a map of field defs by name
    field_map = {f['name']: f for f in fields}

    # Also collect cells (direct child divs) for positional mapping
    cells = [c for c in element.children
             if isinstance(c, Tag) and c.name == 'div']

    for field in fields:
        fname = field['name']

        if fname in hints:
            result[fname] = extract_field_value(hints[fname], fname, field)
        else:
            parent_name, suffix = _resolve_parent_field(fname)
            if parent_name and parent_name in hints:
                result[fname] = extract_collapsed_field(
                    hints[parent_name], fname, field)
            else:
                # Positional fallback for fields with column-group prefixes
                prefix_parts = fname.split('_', 1)
                if len(prefix_parts) == 2 and cells:
                    seen_prefixes = []
                    for f in fields:
                        p = f['name'].split('_', 1)
                        if len(p) == 2 and p[0] not in seen_prefixes:
                            seen_prefixes.append(p[0])
                    prefix = prefix_parts[0]
                    cidx = (seen_prefixes.index(prefix)
                            if prefix in seen_prefixes else 0)
                    if cidx < len(cells):
                        cell = cells[cidx]
                        if suffix:
                            result[fname] = extract_collapsed_field(
                                cell, fname, field)
                        else:
                            result[fname] = extract_field_value(
                                cell, fname, field)
                    else:
                        result[fname] = ''
                else:
                    # Last resort: positional mapping (field index → cell index)
                    field_idx = [f['name'] for f in fields].index(fname)
                    non_collapsed_idx = sum(
                        1 for f in fields[:field_idx]
                        if not _resolve_parent_field(f['name'])[0])
                    if non_collapsed_idx < len(cells):
                        cell = cells[non_collapsed_idx]
                        result[fname] = extract_field_value(
                            cell, fname, field)
                    else:
                        result[fname] = ''

    return result


# ============================================================
# Section & Page Metadata
# ============================================================

def extract_section_metadata(section_div):
    metadata = {}
    sm_div = section_div.find('div', class_='section-metadata')
    if sm_div:
        for row in sm_div.find_all('div', recursive=False):
            cells = row.find_all('div', recursive=False)
            if len(cells) >= 2:
                key = get_text_content(cells[0]).lower()
                value = get_text_content(cells[1])
                metadata[key] = value
    return metadata


def extract_page_metadata(soup):
    metadata = {}
    meta_div = soup.find('div', class_='metadata')
    if meta_div:
        for row in meta_div.find_all('div', recursive=False):
            cells = row.find_all('div', recursive=False)
            if len(cells) >= 2:
                key = get_text_content(cells[0])
                value_cell = cells[1]
                img_src, _ = extract_img_data(value_cell)
                metadata[key] = img_src if img_src else get_text_content(value_cell)
    return metadata


# ============================================================
# Boilerplate Detection
# ============================================================

def strip_boilerplate(html_str):
    """Remove Email Disclaimer / cookie consent boilerplate from section HTML."""
    # Find h6#email-disclaimer and remove everything from there onward
    marker = '<h6 id="email-disclaimer">'
    idx = html_str.find(marker)
    if idx != -1:
        return html_str[:idx].rstrip()
    return html_str


# ============================================================
# Section Processing
# ============================================================

def process_section(section_div, known_blocks):
    section_data = {'metadata': {}, 'components': []}
    section_data['metadata'] = extract_section_metadata(section_div)

    default_buf = []
    comp_idx = 0

    for child in section_div.children:
        if not isinstance(child, Tag):
            text = str(child).strip()
            if text:
                default_buf.append(str(child))
            continue

        block_name = get_block_class(child)
        if block_name and block_name not in known_blocks:
            block_name = None

        if block_name == 'section-metadata' or block_name == 'metadata':
            continue

        if block_name:
            # Flush default content
            if default_buf:
                html = ''.join(default_buf).strip()
                html = strip_boilerplate(html)
                if html:
                    section_data['components'].append({
                        'type': 'text', 'html': html})
                    comp_idx += 1
                default_buf = []

            block_comp = process_block(child, block_name)
            if block_comp:
                section_data['components'].append(block_comp)
                comp_idx += 1
        else:
            default_buf.append(str(child))

    if default_buf:
        html = ''.join(default_buf).strip()
        html = strip_boilerplate(html)
        if html:
            section_data['components'].append({
                'type': 'text', 'html': html})

    return section_data


def process_block(block_div, block_name):
    is_cont = is_container_block(block_name)
    model_id = get_block_model_id(block_name)
    filter_id = get_block_filter_id(block_name)

    res_type = BLOCK_DEFS.get(block_name, {}).get('resourceType', RT_BLOCK)

    comp = {
        'type': 'block',
        'block_name': block_name,
        'resourceType': res_type,
        'model': model_id,
        'filter': filter_id,
        'is_container': is_cont,
    }

    if is_cont:
        item_model_id = get_item_model_id(block_name)
        comp['item_model'] = item_model_id
        comp['item_name'] = get_item_display_name(block_name)
        comp['items'] = []

        rows = [c for c in block_div.children
                if isinstance(c, Tag) and c.name == 'div']
        for row in rows:
            if item_model_id:
                item_data = extract_fields_for_model(row, item_model_id)
            else:
                item_data = {}
            comp['items'].append(item_data)
    else:
        if model_id:
            comp['fields'] = extract_fields_for_model(block_div, model_id)
        else:
            comp['fields'] = {}

    return comp


# ============================================================
# Page Processing
# ============================================================

def process_page(html_content, default_title):
    soup = BeautifulSoup(html_content, 'html.parser')
    known_blocks = get_known_block_names()

    sections = [c for c in soup.children
                if isinstance(c, Tag) and c.name == 'div']

    page_metadata = extract_page_metadata(soup)
    page_title = page_metadata.get('Title', default_title)

    sections_data = []
    for section_div in sections:
        # Skip metadata-only sections
        has_metadata = section_div.find('div', class_='metadata')
        other_tags = [c for c in section_div.children
                      if isinstance(c, Tag) and get_block_class(c) != 'metadata']
        if has_metadata and not other_tags:
            continue

        sd = process_section(section_div, known_blocks)
        if sd['components'] or sd['metadata']:
            sections_data.append(sd)

    return {
        'title': page_title,
        'metadata': page_metadata,
        'sections': sections_data,
    }


# ============================================================
# XML Generation
# ============================================================

class XmlNode:
    def __init__(self, node_name, **attrs):
        self.node_name = node_name
        self.attrs = attrs
        self.children = []

    def add_child(self, child):
        self.children.append(child)
        return child

    def to_xml(self, indent=0):
        pad = '    ' * indent
        attrs = []
        for k, v in self.attrs.items():
            if v is not None:
                attrs.append(f'{k}="{xml_attr_escape(str(v))}"')

        if not attrs:
            attr_str = ''
        elif len(attrs) <= 2 and not self.children:
            attr_str = ' ' + ' '.join(attrs)
        else:
            attr_str = '\n' + '\n'.join(
                f'{pad}    {a}' for a in attrs)

        if not self.children:
            return f'{pad}<{self.node_name}{attr_str}/>'
        lines = [f'{pad}<{self.node_name}{attr_str}>']
        for ch in self.children:
            lines.append(ch.to_xml(indent + 1))
        lines.append(f'{pad}</{self.node_name}>')
        return '\n'.join(lines)


def build_page_xml(title, sections_data, page_metadata):
    root = XmlNode('jcr:root',
        **{
            'xmlns:jcr': 'http://www.jcp.org/jcr/1.0',
            'xmlns:nt': 'http://www.jcp.org/jcr/nt/1.0',
            'xmlns:cq': 'http://www.day.com/jcr/cq/1.0',
            'xmlns:sling': 'http://sling.apache.org/jcr/sling/1.0',
            'jcr:primaryType': 'cq:Page',
        })

    content_attrs = {
        'jcr:primaryType': 'cq:PageContent',
        'jcr:title': title,
        'sling:resourceType': RT_PAGE,
        'cq:conf': '/conf/mcguire-woods',
        'cq:template': '/conf/mcguire-woods/settings/wcm/templates/page',
    }

    # Map page metadata to JCR properties
    meta_map = {
        'Title': 'jcr:title',
        'Description': 'jcr:description',
    }
    for mk, mv in page_metadata.items():
        jcr_prop = meta_map.get(mk)
        if jcr_prop:
            content_attrs[jcr_prop] = mv

    jcr_content = root.add_child(XmlNode('jcr:content', **content_attrs))

    # Root container node - AEM delivery pipeline expects jcr:content/root
    root_container = jcr_content.add_child(XmlNode('root', **{
        'jcr:primaryType': 'nt:unstructured',
    }))

    for si, sd in enumerate(sections_data):
        sec_attrs = {
            'jcr:primaryType': 'nt:unstructured',
            'sling:resourceType': RT_SECTION,
            'model': 'section',
        }
        for k, v in sd.get('metadata', {}).items():
            sec_attrs[k] = v

        sec_node = root_container.add_child(
            XmlNode(f'section{si}', **sec_attrs))

        for ci, comp in enumerate(sd.get('components', [])):
            ctype = comp.get('type')
            if ctype == 'block':
                _add_block_node(sec_node, comp, ci)
            elif ctype == 'text':
                sec_node.add_child(XmlNode(f'text_{ci}',
                    **{
                        'jcr:primaryType': 'nt:unstructured',
                        'sling:resourceType': RT_TEXT,
                        'text': comp.get('html', ''),
                    }))

    xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += root.to_xml()
    xml += '\n'
    return xml


def _add_block_node(parent, comp, idx):
    bn = comp['block_name']
    dn = format_block_display_name(bn)

    attrs = {
        'jcr:primaryType': 'nt:unstructured',
        'sling:resourceType': comp.get('resourceType', RT_BLOCK),
        'name': dn,
    }
    if comp.get('model'):
        attrs['model'] = comp['model']
    if comp.get('filter'):
        attrs['filter'] = comp['filter']

    # Simple block fields
    if not comp.get('is_container'):
        for fn, fv in comp.get('fields', {}).items():
            if fv:
                attrs[fn] = fv

    node_name = f'{make_jcr_name(bn)}_{idx}'
    block_node = parent.add_child(XmlNode(node_name, **attrs))

    # Container items
    if comp.get('is_container') and comp.get('items'):
        for ii, item in enumerate(comp['items']):
            iattrs = {
                'jcr:primaryType': 'nt:unstructured',
                'sling:resourceType': RT_BLOCK_ITEM,
                'name': comp.get('item_name', 'Item'),
                'model': comp.get('item_model', ''),
            }
            for fn, fv in item.items():
                if fv:
                    iattrs[fn] = fv
            block_node.add_child(XmlNode(f'item{ii}', **iattrs))


# ============================================================
# Package Building
# ============================================================

CONTENT_MAP = {
    'content/index.plain.html': ('index', 'McGuireWoods'),
    'content/services.plain.html': ('services', 'Services'),
    'content/services/industries/energy.plain.html':
        ('services/industries/energy', 'Energy'),
    'content/services/industries/healthcare.plain.html':
        ('services/industries/healthcare', 'Healthcare'),
    'content/services/industries/private-equity.plain.html':
        ('services/industries/private-equity', 'Private Equity'),
    'content/services/practices/business-litigation.plain.html':
        ('services/practices/business-litigation', 'Business Litigation'),
    'content/services/practices/data-privacy-cybersecurity.plain.html':
        ('services/practices/data-privacy-cybersecurity',
         'Data Privacy & Cybersecurity'),
    'content/services/practices/intellectual-property.plain.html':
        ('services/practices/intellectual-property', 'Intellectual Property'),
}

NAV_FOOTER_MAP = {
    'nav.plain.html': ('nav', 'Navigation'),
    'footer.plain.html': ('footer', 'Footer'),
}

INTERMEDIATE_FOLDERS = {
    'services/industries': 'Industries',
    'services/practices': 'Practices',
}


def ensure_dir(path):
    os.makedirs(path, exist_ok=True)


def create_sling_folder_xml(title):
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<jcr:root xmlns:jcr="http://www.jcp.org/jcr/1.0"'
        ' xmlns:sling="http://sling.apache.org/jcr/sling/1.0"\n'
        f'    jcr:primaryType="sling:OrderedFolder"'
        f' jcr:title="{xml_attr_escape(title)}"/>\n'
    )


def main():
    print('Loading component definitions...')
    load_definitions()
    print(f'  {len(BLOCK_DEFS)} block definitions')
    print(f'  {len(BLOCK_MODELS)} models')
    print(f'  {len(CONTAINER_FILTERS)} filters')

    # Clean old package
    if os.path.exists(PACKAGE_DIR):
        shutil.rmtree(PACKAGE_DIR)

    ensure_dir(os.path.join(PACKAGE_DIR, 'META-INF', 'vault'))
    ensure_dir(JCR_BASE)

    # META-INF / vault files
    with open(os.path.join(PACKAGE_DIR, 'META-INF', 'vault',
                           'filter.xml'), 'w') as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n'
                '<workspaceFilter version="1.0">\n'
                '  <filter root="/content/mcguire-woods" mode="merge"/>\n'
                '</workspaceFilter>\n')

    with open(os.path.join(PACKAGE_DIR, 'META-INF', 'vault',
                           'properties.xml'), 'w') as f:
        f.write(
            '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n'
            '<!DOCTYPE properties SYSTEM'
            ' "http://java.sun.com/dtd/properties.dtd">\n'
            '<properties>\n'
            '  <entry key="name">mcguire-woods-content</entry>\n'
            '  <entry key="version">6.0.0</entry>\n'
            '  <entry key="group">mcguire-woods</entry>\n'
            '  <entry key="description">McGuireWoods EDS content -'
            ' JCR structured content for Universal Editor</entry>\n'
            '  <entry key="createdBy">excat-migration</entry>\n'
            '  <entry key="packageType">content</entry>\n'
            '</properties>\n')

    with open(os.path.join(PACKAGE_DIR, 'META-INF', 'vault',
                           'config.xml'), 'w') as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n'
                '<vaultfs version="1.1">\n'
                '  <aggregates/>\n'
                '  <handlers/>\n'
                '</vaultfs>\n')

    # Create site root node at /content/mcguire-woods
    root_xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<jcr:root xmlns:jcr="http://www.jcp.org/jcr/1.0"'
        ' xmlns:nt="http://www.jcp.org/jcr/nt/1.0"'
        ' xmlns:cq="http://www.day.com/jcr/cq/1.0"'
        ' xmlns:sling="http://sling.apache.org/jcr/sling/1.0"\n'
        '    jcr:primaryType="cq:Page">\n'
        '    <jcr:content\n'
        '        jcr:primaryType="cq:PageContent"\n'
        '        jcr:title="McGuireWoods"\n'
        '        sling:resourceType="core/franklin/components/page/v1/page"\n'
        '        cq:conf="/conf/mcguire-woods"\n'
        '        cq:allowedTemplates="[/conf/mcguire-woods/settings/wcm/templates/.*]"/>\n'
        '</jcr:root>\n'
    )
    with open(os.path.join(JCR_BASE, '.content.xml'), 'w', encoding='utf-8') as f:
        f.write(root_xml)
    print('Created site root: /content/mcguire-woods')

    # Process content pages
    pages = 0
    for rel_path, (jcr_sub, default_title) in CONTENT_MAP.items():
        html_file = os.path.join(WORKSPACE, rel_path)
        if not os.path.exists(html_file):
            print(f'  SKIP (not found): {rel_path}')
            continue

        print(f'Processing: {rel_path}')
        with open(html_file, 'r', encoding='utf-8') as f:
            html_content = f.read()

        pdata = process_page(html_content, default_title)
        xml = build_page_xml(pdata['title'], pdata['sections'],
                             pdata['metadata'])

        page_dir = os.path.join(JCR_BASE, jcr_sub) if jcr_sub else JCR_BASE
        ensure_dir(page_dir)
        outpath = os.path.join(page_dir, '.content.xml')
        with open(outpath, 'w', encoding='utf-8') as f:
            f.write(xml)

        nsections = len(pdata['sections'])
        ncomps = sum(len(s['components']) for s in pdata['sections'])
        print(f'  -> {jcr_sub or "(root)"}: {nsections} sections,'
              f' {ncomps} components')
        pages += 1

    # Nav and footer
    for rel_path, (jcr_sub, default_title) in NAV_FOOTER_MAP.items():
        html_file = os.path.join(WORKSPACE, rel_path)
        if not os.path.exists(html_file):
            print(f'  SKIP (not found): {rel_path}')
            continue

        print(f'Processing: {rel_path}')
        with open(html_file, 'r', encoding='utf-8') as f:
            html_content = f.read()

        pdata = process_page(html_content, default_title)
        xml = build_page_xml(pdata['title'], pdata['sections'],
                             pdata.get('metadata', {}))

        page_dir = os.path.join(JCR_BASE, jcr_sub)
        ensure_dir(page_dir)
        outpath = os.path.join(page_dir, '.content.xml')
        with open(outpath, 'w', encoding='utf-8') as f:
            f.write(xml)

        print(f'  -> {jcr_sub}')
        pages += 1

    # Intermediate folder nodes
    for fpath, ftitle in INTERMEDIATE_FOLDERS.items():
        fdir = os.path.join(JCR_BASE, fpath)
        ensure_dir(fdir)
        cxpath = os.path.join(fdir, '.content.xml')
        if not os.path.exists(cxpath):
            with open(cxpath, 'w', encoding='utf-8') as f:
                f.write(create_sling_folder_xml(ftitle))
            print(f'Created folder: {fpath}')

    # Build ZIP
    print(f'\nBuilding ZIP: {OUTPUT_ZIP}')
    if os.path.exists(OUTPUT_ZIP):
        os.remove(OUTPUT_ZIP)

    with zipfile.ZipFile(OUTPUT_ZIP, 'w', zipfile.ZIP_DEFLATED) as zf:
        for root, _dirs, files in os.walk(PACKAGE_DIR):
            for fn in files:
                fp = os.path.join(root, fn)
                arcname = os.path.relpath(fp, PACKAGE_DIR)
                zf.write(fp, arcname)

    zsize = os.path.getsize(OUTPUT_ZIP)
    print(f'\nDone! Package: {OUTPUT_ZIP} ({zsize / 1024:.1f} KB)')
    print(f'Pages: {pages}')

    with zipfile.ZipFile(OUTPUT_ZIP, 'r') as zf:
        names = sorted(zf.namelist())
        print(f'Files: {len(names)}')
        for n in names:
            print(f'  {n}')


if __name__ == '__main__':
    main()
