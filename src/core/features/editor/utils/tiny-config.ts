// (C) Copyright 2015 Moodle Pty Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { CoreFile } from '@services/file';
import { CoreLang } from '@services/lang';
import { CorePath } from '@singletons/path';
import { CoreEditorTiny } from '../services/tiny';
import type { RawEditorOptions, TinyMCE } from 'tinymce';
import { ContextLevel } from '@/core/constants';

/**
 * Get default editor configuration.
 * TODO: Use site settings.
 *
 * @param contextLevel Context level: system, user, coursecat, course, module or block.
 * @param instanceId ID of item associated with the context level.
 * @returns Promise resovled with configuration.
 */
export async function getEditorOptions($contextLevel: ContextLevel, $instanceId: number): Promise<RawEditorOptions> {
    const [globalConfig, contextConfig] = await Promise.all([
        CoreEditorTiny.getGlobalConfiguration(),
        CoreEditorTiny.getContextConfiguration($contextLevel, $instanceId),
    ]);

    const tinyMCE = await getTinyMCE();

    let premiumPlugins: string[] = [];
    if (globalConfig.plugins.premium?.apikey && contextConfig.plugins.premium?.canacesspremium) {
        try {
            await loadPremiumPlugins(tinyMCE, globalConfig.plugins.premium.apikey);
            premiumPlugins = globalConfig.plugins.premium.premiumplugins;
        } catch {
            // Ignore error.
        }
    }

    return {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        base_url: getBaseURL(),
        suffix: '.min',

        // Behaviour of the toolbar.
        // https://www.tiny.cloud/docs/tinymce/6/toolbar-configuration-options/#toolbar_mode
        // eslint-disable-next-line @typescript-eslint/naming-convention
        toolbar_mode: 'sliding',

        // Toolbar configuration.
        // https://www.tiny.cloud/docs/tinymce/6/toolbar-configuration-options/#toolbar
        // TODO: Set items of enabled plugins only.
        toolbar: [
            {
                name: 'history',
                items: [
                    'undo',
                    'redo',
                ],
            },
            {
                name: 'formatting',
                items: [
                    'bold',
                    'italic',
                ],
            },
            {
                name: 'premium_b',
                items: [
                  'typography',
                ],
              },
            {
                name: 'content',
                items: [
                    'tiny_media_image',
                    'editimage',
                    'tiny_media_video',
                    'tiny_recordrtc_audio',
                    'tiny_recordrtc_video_context_menu',
                    'pageembed',
                    'link',
                    'tiny_h5p',
                    'tiny_link_link',
                    'tiny_link_unlink',
                    'tiny_noautolink',
                ],
            },
            {
                name: 'view',
                items: [
                    'fullscreen',
                ],
            },
            {
                name: 'alignment',
                items: [
                    'alignleft',
                    'aligncenter',
                    'alignright',
                ],
            },
            {
                name: 'directionality',
                items: [
                    'ltr',
                    'rtl',
                ],
            },
            {
                name: 'indentation',
                items: [
                    'outdent',
                    'indent',
                ],
            },
            {
                name: 'lists',
                items: [
                    'bullist',
                    'numlist',
                    'checklist',
                ],
            },
            {
                name: 'advanced',
                items: [
                  'tiny_equation',
                ],
            },
            {
                name: 'premium_a',
                items: [
                  'casechange',
                  'spellcheckdialog',
                  'permanentpen',
                  'formatpainter',
                  'tableofcontents',
                  'footnotes',
                ],
              },
            {
                name: 'comments',
                items: [
                    'addcomment',
                ],
            },
        ],

        // Quickbars Selection Toolbar configuration.
        // https://www.tiny.cloud/docs/tinymce/6/quickbars/#quickbars_selection_toolbar
        // eslint-disable-next-line @typescript-eslint/naming-convention
        quickbars_selection_toolbar: 'bold italic | quicklink h3 h4 h5 h6 blockquote | tiny_noautolink',

        // Disable quickbars entirely.
        // The UI is not ideal and we'll wait for it to improve in future before we enable it in Moodle.
        // eslint-disable-next-line @typescript-eslint/naming-convention
        quickbars_insert_toolbar: '',

        // Quickbars Image Toolbar configuration.
        // https://www.tiny.cloud/docs/tinymce/6/quickbars/#quickbars_image_toolbar
        // eslint-disable-next-line @typescript-eslint/naming-convention
        quickbars_image_toolbar: 'alignleft aligncenter alignright',

        // Menu configuration.
        // https://www.tiny.cloud/docs/tinymce/6/menus-configuration-options/
        menu: {
            file: {
                title: 'File',
                items: '',
            },
            edit: {
                title: 'Edit',
                items: 'undo redo | cut copy paste pastetext | selectall | searchreplace',
            },
            view: {
                title: 'View',
                items: 'code | visualaid visualchars visualblocks | spellchecker | preview fullscreen | showcomments',
            },
            insert: {
                title: 'Insert',
                items: 'tiny_media_image tiny_link_link tiny_media_video tiny_recordrtc_audio tiny_recordrtc_video'
                    + ' tiny_recordrtc_screen addcomment pageembed template codesample inserttable | charmap emoticons hr |'
                    + ' pagebreak nonbreaking anchor tableofcontents footnotes | insertdatetime tiny_equation tiny_h5p',
            },
            format: {
                title: 'Format',
                items: 'bold italic underline strikethrough superscript subscript codeformat | blocks align lineheight | language'
                    + ' | removeformat | tiny_noautolink | permanentpen configurepermanentpen',
            },
            tools: {
                title: 'Tools',
                items: 'spellchecker spellcheckerlanguage spellcheckdialog | autocorrect capitalization | a11ycheck code wordcount'
                    + ` tiny_accessibilitychecker ${contextConfig.plugins.media ? 'tiny_mediamanager': ''} | export`,
            },
            table: {
                title: 'Table',
                items: 'inserttable | cell row column | advtablesort | advtablerownumbering | tableprops deletetable',
            },
            help: {
                title: 'Help',
                items: 'help',
            },
        },

        // Mobile configuration.
        // At this time we will use the default TinyMCE mobile configuration.
        // https://www.tiny.cloud/docs/tinymce/6/tinymce-for-mobile/

        // Skins.
        skin: 'oxide',

        // Set the minimum height to the smallest height that we can fit the Menu bar, Tool bar, Status bar and the text area.
        // https://www.tiny.cloud/docs/tinymce/6/customize-ui/#set-maximum-and-minimum-heights-and-widths
        // eslint-disable-next-line @typescript-eslint/naming-convention
        min_height: 200,

        // Set the language.
        // https://www.tiny.cloud/docs/tinymce/6/ui-localization/#language
        language: await CoreLang.getCurrentLanguage(),

        // Do not convert URLs to relative URLs.
        // https://www.tiny.cloud/docs/tinymce/6/url-handling/#convert_urls
        // eslint-disable-next-line @typescript-eslint/naming-convention
        convert_urls: false,

        // Enabled 'advanced' a11y options.
        // This includes allowing role="presentation" from the image uploader.
        // https://www.tiny.cloud/docs/tinymce/6/accessibility/
        // eslint-disable-next-line @typescript-eslint/naming-convention
        a11y_advanced_options: true,

        // Add specific rules to the valid elements.
        // eslint-disable-next-line @typescript-eslint/naming-convention
        extended_valid_elements: 'script[*],p[*],i[*]',

        // Disable XSS Sanitisation.
        // We do this in PHP.
        // https://www.tiny.cloud/docs/tinymce/6/security/#turning-dompurify-off
        // Note: This feature has been backported from TinyMCE 6.4.0.
        // eslint-disable-next-line @typescript-eslint/naming-convention
        xss_sanitization: false,

        // Override the standard block formats property (removing h1 & h2).
        // https://www.tiny.cloud/docs/tinymce/6/user-formatting-options/#block_formats
        // eslint-disable-next-line @typescript-eslint/naming-convention
        block_formats: 'Paragraph=p;Heading 3=h3;Heading 4=h4;Heading 5=h5;Heading 6=h6;Preformatted=pre',

        // The list of plugins to include in the instance.
        // https://www.tiny.cloud/docs/tinymce/6/editor-important-options/#plugins
        plugins: [
            // Tiny plugins.
            'anchor',
            'charmap',
            'code',
            'codesample',
            'directionality',
            'emoticons',
            'fullscreen',
            'help',
            'insertdatetime',
            'lists',
            'nonbreaking',
            'pagebreak',
            'quickbars',
            'save',
            'searchreplace',
            'table',
            'visualblocks',
            'visualchars',
            'wordcount',
            // Moodle plugins.
            // 'tiny_accessibilitychecker/plugin',
            // 'tiny_autosave/plugin',
            // 'tiny_equation/plugin',
            // 'tiny_h5p/plugin',
            // 'tiny_html/plugin',
            // 'tiny_link/plugin',
            // 'tiny_media/plugin',
            // 'tiny_noautolink/plugin',
            // 'tiny_recordrtc/plugin',
            ...premiumPlugins,
        ],

        // Do not show the help link in the status bar.
        // https://www.tiny.cloud/docs/tinymce/latest/accessibility/#help_accessibility
        // eslint-disable-next-line @typescript-eslint/naming-convention
        help_accessibility: false,

        // Remove the "Upgrade" link for Tiny.
        // https://www.tiny.cloud/docs/tinymce/6/editor-premium-upgrade-promotion/
        promotion: false,

        // Allow the administrator to disable branding.
        // https://www.tiny.cloud/docs/tinymce/6/statusbar-configuration-options/#branding
        branding: globalConfig.branding,

        // Put th cells in a thead element.
        // https://www.tiny.cloud/docs/tinymce/6/table-options/#table_header_type
        // eslint-disable-next-line @typescript-eslint/naming-convention
        table_header_type: 'sectionCells',

        // Stored text in non-entity form.
        // https://www.tiny.cloud/docs/tinymce/6/content-filtering/#entity_encoding
        // eslint-disable-next-line @typescript-eslint/naming-convention
        entity_encoding: 'raw',

        // Enable support for editors in scrollable containers.
        // https://www.tiny.cloud/docs/tinymce/6/ui-mode-configuration-options/#ui_mode
        // eslint-disable-next-line @typescript-eslint/naming-convention
        ui_mode: 'split',

        // Enable browser-supported spell checking.
        // https://www.tiny.cloud/docs/tinymce/latest/spelling/
        // eslint-disable-next-line @typescript-eslint/naming-convention
        browser_spellcheck: true,

        // Highlight the editor on focus.
        // https://www.tiny.cloud/docs/tinymce/latest/content-appearance/#highlight_on_focus
        // eslint-disable-next-line @typescript-eslint/naming-convention
        highlight_on_focus: true,

        // Context menu configuration.
        // https://www.tiny.cloud/docs/tinymce/latest/menus-configuration-options/#contextmenu
        contextmenu: 'tiny_media_image tiny_media_video spellchecker configurepermanentpen linkchecker',

        // Use filename from server for uploaded images.
        // https://www.tiny.cloud/docs/tinymce/latest/upload-images/#images_reuse_filename
        // eslint-disable-next-line @typescript-eslint/naming-convention
        images_reuse_filename: true,

        // Edit image contextual toolbar configuration.
        // https://www.tiny.cloud/docs/tinymce/latest/editimage/#editimage_toolbar
        // eslint-disable-next-line @typescript-eslint/naming-convention
        editimage_toolbar: 'rotateleft rotateright flipv fliph editimage',

        // Display the menu bar in phones.
        mobile: {
            menubar: true,
        },

        setup: (editor) => {
            editor.on('init', function() {
                // TODO: Hide justify alignment sub-menu.
            });
        },
    };
}

/**
 * Get base URL of TinyMCE.
 *
 * @returns The base URL.
 */
function getBaseURL(): string {
    const wwwPath = CoreFile.getWWWPath();

    return CorePath.concatenatePaths(wwwPath, 'tinymce');
}

/** Promise for TinyMCE API object. */
let tinyPromise;

/**
 * Get the TinyMCE API Object.
 *
 * @returns The TinyMCE API Object
 */
export function getTinyMCE(): Promise<TinyMCE> {
    if (tinyPromise) {
        return tinyPromise;
    }

    tinyPromise = new Promise((resolve, reject) => {
        let script = document.head.querySelector<HTMLScriptElement>('script[data-tinymce="tinymce"]');
        if (script) {
            resolve(window['tinyMCE']);

            return;
        }

        script = document.createElement('script');
        script.dataset.tinymce = 'tinymce';
        script.src = CorePath.concatenatePaths(getBaseURL(), 'tinymce.min.js');
        script.async = true;
        script.onload = () => {
            resolve(window['tinyMCE']);
        };
        script.onerror = () => {
            reject('Error loading TinyMCE.');
        };

        document.head.append(script);
    });

    return tinyPromise;
}

/** Promise for Tiny Premium plugins script and used API key. */
let premiumPluginsPromise: Promise<void> | undefined;
let premiumPluginsApiKey = '';

/**
 * Return promise for Tiny Premium plugins script.
 *
 * @param tinyMCE TinyMCE API object.
 * @param apiKey TinyMCE api key.
 * @returns Promise resovled when plugins are loaded.
 */
function loadPremiumPlugins(tinyMCE: TinyMCE, apiKey: string): Promise<void> {
    if (premiumPluginsPromise && apiKey === premiumPluginsApiKey) {
        return premiumPluginsPromise;
    }

    premiumPluginsApiKey = apiKey;
    premiumPluginsPromise = new Promise((resolve, reject) => {
        const version = `${tinyMCE.majorVersion}.${tinyMCE.minorVersion}`;
        const script = document.createElement('script');
        script.dataset.tinymce = 'premium';
        script.referrerPolicy = 'origin';
        script.src = `https://cdn.tiny.cloud/1/${apiKey}/tinymce/${version}/plugins.min.js`;
        script.onload = () => {
            resolve();
        };
        script.onerror = () => {
            reject('Error loading TinyMCE premium plugin.');
        };

        document.head.append(script);
    });

    return premiumPluginsPromise;
}

/**
 * Get the link to the user documentation for the named plugin.
 *
 * @param pluginName The plugin name.
 * @returns Documentation URL.
 */
export function getDocumentationLink(pluginName: string): string {
    return `https://docs.moodle.org/en/editor_tiny/${pluginName}`;
}
