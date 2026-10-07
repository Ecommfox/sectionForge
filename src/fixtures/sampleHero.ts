import { BuilderEntry } from '../types/builder';

export const GOLDEN_HERO_ENTRY: BuilderEntry = {
  id: 'bldr_entry_hero_0918',
  name: 'Hero Section — Trail Heritage',
  modelName: 'hero-section',
  lastUpdated: '10 mins ago',
  published: 'published',
  data: {
    sectionData: [
      {
        type: 'header',
        id: 'header_content',
        label: 'Hero Content'
      },
      {
        type: 'text',
        id: 'header_title',
        label: 'Heading Title',
        default: 'Designed for the long way around.'
      },
      {
        type: 'text',
        id: 'eyebrow_text',
        label: 'Eyebrow Tag',
        default: 'Spring / Summer 2025'
      },
      {
        type: 'textarea',
        id: 'subheading',
        label: 'Subheading Description',
        default: 'Engineered for untamed paths, alpine crossings, and weather without compromise.'
      },
      {
        type: 'image_picker',
        id: 'header_image',
        label: 'Background Hero Image',
        default: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1800&q=85'
      },
      {
        type: 'text',
        id: 'button_label',
        label: 'Primary CTA Label',
        default: 'Explore The Expedition'
      },
      {
        type: 'url',
        id: 'button_url',
        label: 'Primary CTA Link',
        default: '/collections/alpine-gear'
      },
      {
        type: 'range',
        id: 'title_size',
        label: 'Desktop Title Font Size',
        min: 24,
        max: 72,
        step: 2,
        unit: 'px',
        default: 52
      },
      {
        type: 'color',
        id: 'accent_color',
        label: 'Eyebrow & Accent Color',
        default: '#8ed0a5'
      },
      {
        type: 'select',
        id: 'content_alignment',
        label: 'Content Alignment',
        default: 'left',
        options: [
          { value: 'left', label: 'Left Aligned' },
          { value: 'center', label: 'Centered' },
          { value: 'right', label: 'Right Aligned' }
        ]
      }
    ],
    customFonts: [
      {
        name: 'Inter Tight',
        weights: ['400', '600', '800']
      }
    ],
    blocks: [
      {
        id: 'block_hero_container',
        layerName: 'Hero Container',
        responsiveStyles: {
          large: {
            position: 'relative',
            display: 'flex',
            minHeight: '620px',
            backgroundColor: '#0e2118',
            overflow: 'hidden',
            alignItems: 'flex-end',
            paddingBottom: '60px',
            paddingLeft: '48px',
            paddingRight: '48px'
          },
          medium: {
            minHeight: '520px',
            paddingLeft: '28px',
            paddingRight: '28px'
          },
          small: {
            minHeight: '440px',
            paddingLeft: '20px',
            paddingRight: '20px'
          }
        },
        bindings: {
          'style.marginTop': 'window.data.hero.block_top_margin' // Orphan binding test
        },
        children: [
          {
            id: 'block_bg_image_wrap',
            layerName: 'Background Image Media',
            show: 'window.data.hero.header_image',
            responsiveStyles: {
              large: {
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                zIndex: '1'
              }
            },
            children: [
              {
                id: 'block_custom_liquid_img',
                layerName: 'Custom Liquid Image Tag',
                component: {
                  name: 'Custom Code',
                  options: {
                    code: '{{ section.settings.header_image | image_url: width: 1800 | image_tag: class: "sf-hero__bg-img", loading: "eager", widths: "720, 1080, 1440, 1800" }}'
                  }
                }
              }
            ]
          },
          {
            id: 'block_theme_editor_helper',
            layerName: 'Builder Design Mode Script',
            component: {
              name: 'Custom Code',
              options: {
                code: '{% if request.design_mode %}<script>console.log("Builder live theme sync active");</script>{% endif %}'
              }
            }
          },
          {
            id: 'block_hero_content',
            layerName: 'Hero Content Card',
            responsiveStyles: {
              large: {
                position: 'relative',
                zIndex: '2',
                maxWidth: '680px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              },
              small: {
                maxWidth: '100%'
              }
            },
            children: [
              {
                id: 'block_eyebrow',
                layerName: 'Eyebrow Tag',
                component: {
                  name: 'Text',
                  options: {
                    text: '<p><br></p>' // Static placeholder to be ignored
                  }
                },
                bindings: {
                  'component.options.text': 'window.data.hero.eyebrow_text',
                  'style.color': 'window.data.hero.accent_color'
                },
                responsiveStyles: {
                  large: {
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    fontWeight: '600'
                  }
                }
              },
              {
                id: 'block_title',
                layerName: 'Hero Main Title',
                component: {
                  name: 'Heading',
                  options: {
                    text: 'Fallback Title',
                    level: 1
                  }
                },
                bindings: {
                  'component.options.text': 'window.data.hero.header_title',
                  'style.fontSize': 'data.hero.title_size'
                },
                responsiveStyles: {
                  large: {
                    fontFamily: '"Inter Tight", sans-serif',
                    color: '#ffffff',
                    fontWeight: '800',
                    lineHeight: '1.08',
                    letterSpacing: '-0.03em'
                  },
                  small: {
                    fontSize: '32px'
                  }
                }
              },
              {
                id: 'block_subheading',
                layerName: 'Subheading Description',
                component: {
                  name: 'Text',
                  options: {
                    text: '<p><br></p>'
                  }
                },
                bindings: {
                  'component.options.text': 'window.data.hero.subheading'
                },
                responsiveStyles: {
                  large: {
                    color: 'rgba(255, 255, 255, 0.82)',
                    fontSize: '16px',
                    lineHeight: '1.5'
                  }
                }
              },
              {
                id: 'block_cta_button',
                layerName: 'CTA Action Button',
                component: {
                  name: 'Button',
                  options: {
                    text: 'Shop Collection',
                    link: '#'
                  }
                },
                bindings: {
                  'component.options.text': 'window.data.hero.button_label',
                  'component.options.link': 'window.data.hero.button_url'
                },
                responsiveStyles: {
                  large: {
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '14px 28px',
                    backgroundColor: '#ffffff',
                    color: '#153123',
                    fontWeight: '700',
                    textDecoration: 'none',
                    borderRadius: '2px',
                    fontSize: '13px',
                    letterSpacing: '0.04em',
                    width: 'fit-content'
                  }
                }
              }
            ]
          }
        ]
      }
    ],
    jsCode: 'window.data = window.data || {}; console.log("Builder runtime mounted");',
    state: { heroMounted: true, count: 1 },
    inputs: [{ name: 'dummyInput', type: 'string' }]
  }
};

export const SAMPLE_BANNER_ENTRY: BuilderEntry = {
  id: 'bldr_entry_banner_012',
  name: 'Announcement Bar — Flash Sale Notice',
  modelName: 'announcement-bar',
  lastUpdated: '1 hour ago',
  published: 'published',
  data: {
    sectionData: [
      {
        type: 'text',
        id: 'promo_text',
        label: 'Promo Text',
        default: 'Complimentary worldwide express shipping on orders over $150.'
      },
      {
        type: 'text',
        id: 'link_text',
        label: 'Action Link Label',
        default: 'Shop Flash Drop'
      },
      {
        type: 'url',
        id: 'link_url',
        label: 'Action Link URL',
        default: '/collections/seasonal-specials'
      },
      {
        type: 'color',
        id: 'bar_bg',
        label: 'Background Bar Color',
        default: '#bd593c'
      },
      {
        type: 'color',
        id: 'bar_text_color',
        label: 'Text Color',
        default: '#ffffff'
      }
    ],
    blocks: [
      {
        id: 'banner_container',
        layerName: 'Announcement Wrapper',
        responsiveStyles: {
          large: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '12px 20px',
            gap: '12px',
            fontSize: '12px',
            fontWeight: '600'
          }
        },
        bindings: {
          'style.backgroundColor': 'window.data.hero.bar_bg',
          'style.color': 'window.data.hero.bar_text_color'
        },
        children: [
          {
            id: 'banner_text',
            layerName: 'Message Text',
            component: {
              name: 'Text',
              options: { text: '<p><br></p>' }
            },
            bindings: {
              'component.options.text': 'window.data.hero.promo_text'
            }
          },
          {
            id: 'banner_link',
            layerName: 'Callout Link',
            component: {
              name: 'Button',
              options: { text: 'Shop Now', link: '#' }
            },
            bindings: {
              'component.options.text': 'window.data.hero.link_text',
              'component.options.link': 'window.data.hero.link_url'
            }
          }
        ]
      }
    ]
  }
};

export const SAMPLE_FEATURES_ENTRY: BuilderEntry = {
  id: 'bldr_entry_feat_044',
  name: 'Benefit Grid — 3 Pillars',
  modelName: 'benefit-grid',
  lastUpdated: 'Yesterday',
  published: 'published',
  data: {
    sectionData: [
      {
        type: 'text',
        id: 'grid_heading',
        label: 'Grid Section Heading',
        default: 'Engineered Without Compromise'
      },
      {
        type: 'color',
        id: 'grid_bg',
        label: 'Background Color',
        default: '#fcfbf7'
      }
    ],
    blocks: [
      {
        id: 'features_container',
        layerName: '3-Column Grid Wrapper',
        responsiveStyles: {
          large: {
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '32px',
            padding: '60px 48px'
          },
          small: {
            gridTemplateColumns: '1fr',
            gap: '24px',
            padding: '40px 20px'
          }
        },
        children: [
          {
            id: 'card_1',
            layerName: 'Pillar 1: Weatherproof',
            component: {
              name: 'Card',
              options: { title: 'Waterproof Membrane', desc: 'Tested in severe alpine rainstorms.' }
            }
          },
          {
            id: 'card_2',
            layerName: 'Pillar 2: Recycled',
            component: {
              name: 'Card',
              options: { title: '100% Recycled Ripstop', desc: 'Sustainable construction built to endure.' }
            }
          },
          {
            id: 'card_3',
            layerName: 'Pillar 3: Lifetime',
            component: {
              name: 'Card',
              options: { title: 'Lifetime Warranty', desc: 'Repairs and coverage on every expedition.' }
            }
          }
        ]
      }
    ]
  }
};

export const ALL_SAMPLE_ENTRIES = [
  GOLDEN_HERO_ENTRY,
  SAMPLE_BANNER_ENTRY,
  SAMPLE_FEATURES_ENTRY
];
