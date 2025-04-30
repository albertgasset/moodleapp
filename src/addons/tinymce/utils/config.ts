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

import { CoreLang } from '@services/lang';
import { ContextLevel } from '@/core/constants';
import type { Editor, RawEditorOptions } from 'tinymce';
import { CoreSettingsHelper } from '@features/settings/services/settings-helper';
import { getBaseURL, loadLanguageStrings } from './loader';
import { Translate } from '@singletons';

type GetEditorOptionsParams = {
    target: HTMLTextAreaElement;
    contextLevel: ContextLevel;
    instanceId: number;
    placeholder: string;
};

/**
 * Get default editor configuration.
 *
 * @param params Editor parameters.
 * @returns Promise resolved with configuration.
 */
export async function getEditorOptions(params: GetEditorOptionsParams): Promise<RawEditorOptions> {
    const lang = await CoreLang.getCurrentLanguage();
    await loadLanguageStrings(lang);

    const darkMode = CoreSettingsHelper.isDarkModeEnabled();

    return {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        base_url: getBaseURL(),
        suffix: '.min',

        // Set the editor target.
        // https://www.tiny.cloud/docs/tinymce/latest/editor-important-options/#target
        target: params.target,

        // Placeholder.
        // https://www.tiny.cloud/docs/tinymce/latest/editor-important-options/#placeholder
        placeholder: params.placeholder,

        // Toolbar configuration.
        // https://www.tiny.cloud/docs/tinymce/latest/toolbar-configuration-options/#toolbar
        toolbar: [
            { name: 'view', items: ['fullscreen'] },
            { name: 'history', items: ['undo', 'redo'] },
            { name: 'formatting', items: ['bold', 'italic', 'underline','strikethrough'] },
            { name: 'blocks', items: ['blocks'] },
            { name: 'scanqr', items: ['scanqr'] },
            { name: 'alignment', items: ['align'] },
            { name: 'directionality', items: ['ltr', 'rtl'] },
            { name: 'indentation', items: ['outdent', 'indent'] },
            { name: 'lists', items: ['bullist', 'numlist'] },
            { name: 'removeformat', items: ['removeformat'] },
            { name: 'code', items: ['code'] },
        ],

        // Quickbars Image Toolbar configuration.
        // https://www.tiny.cloud/docs/tinymce/latest/quickbars/#quickbars_image_toolbar
        // eslint-disable-next-line @typescript-eslint/naming-convention
        quickbars_image_toolbar: 'alignleft aligncenter alignright',

        // Disable quickbars entirely.
        // The UI is not ideal and we'll wait for it to improve in future before we enable it in Moodle.
        // eslint-disable-next-line @typescript-eslint/naming-convention
        quickbars_insert_toolbar: '',

        // Quickbars Selection Toolbar configuration.
        // https://www.tiny.cloud/docs/tinymce/latest/quickbars/#quickbars_selection_toolbar
        // eslint-disable-next-line @typescript-eslint/naming-convention
        quickbars_selection_toolbar: 'bold italic | quicklink h3 h4 h5 h6 blockquote',

        // Menu configuration.
        // https://www.tiny.cloud/docs/tinymce/latest/menus-configuration-options/
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
                items: 'code | visualaid visualchars visualblocks',
            },
            insert: {
                title: 'Insert',
                items: 'scanqr codesample inserttable | charmap emoticons hr | pagebreak nonbreaking anchor | insertdatetime',
            },
            format: {
                title: 'Format',
                items: 'bold italic underline strikethrough superscript subscript codeformat | blocks align lineheight'
                    + ' | removeformat',
            },
            tools: {
                title: 'Tools',
                items: ' code wordcount',
            },
            table: {
                title: 'Table',
                items: 'inserttable | cell row column | tableprops deletetable',
            },
            help: {
                title: 'Help',
                items: 'help',
            },
        },

        // Set the minimum height to the smallest height that we can fit the Menu bar, Tool bar, Status bar and the text area.
        // https://www.tiny.cloud/docs/tinymce/latest/customize-ui/#set-maximum-and-minimum-heights-and-widths
        // eslint-disable-next-line @typescript-eslint/naming-convention
        min_height: 175,

        // Sets the height of the entire editor, including the menu bar, toolbars, and status bar.
        // https://www.tiny.cloud/docs/tinymce/latest/editor-size-options/#height
        height: '100%',

        // Set the language.
        // https://www.tiny.cloud/docs/tinymce/latest/ui-localization/#language
        language: lang,

        // Disable default iframe sandboxing.
        // https://www.tiny.cloud/docs/tinymce/latest/content-filtering/#sandbox-iframes
        // eslint-disable-next-line @typescript-eslint/naming-convention
        sandbox_iframes: false,

        // Do not convert URLs to relative URLs.
        // https://www.tiny.cloud/docs/tinymce/latest/url-handling/#convert_urls
        // eslint-disable-next-line @typescript-eslint/naming-convention
        convert_urls: false,

        // Enabled 'advanced' a11y options.
        // This includes allowing role="presentation" from the image uploader.
        // https://www.tiny.cloud/docs/tinymce/latest/accessibility/
        // eslint-disable-next-line @typescript-eslint/naming-convention
        a11y_advanced_options: true,

        // Add specific rules to the valid elements.
        // eslint-disable-next-line @typescript-eslint/naming-convention
        extended_valid_elements: 'script[*],p[*],i[*]',

        // Disable XSS Sanitisation.
        // We do this in PHP.
        // https://www.tiny.cloud/docs/tinymce/latest/security/#turning-dompurify-off
        // eslint-disable-next-line @typescript-eslint/naming-convention
        xss_sanitization: false,

        // Override the standard block formats property (removing h1 & h2).
        // https://www.tiny.cloud/docs/tinymce/latest/user-formatting-options/#block_formats
        // eslint-disable-next-line @typescript-eslint/naming-convention
        block_formats: 'Paragraph=p;Heading 3=h3;Heading 4=h4;Heading 5=h5;Heading 6=h6;Preformatted=pre',

        // The list of plugins to include in the instance.
        // https://www.tiny.cloud/docs/tinymce/latest/editor-important-options/#plugins
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
            'moodleapp/scanqr',
        ],

        // Skins.
        skin:  darkMode ? 'oxide-dark' : 'oxide',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        content_css: darkMode ? 'dark' : 'default',

        // Do not show the help link in the status bar.
        // https://www.tiny.cloud/docs/tinymce/latest/accessibility/#help_accessibility
        // eslint-disable-next-line @typescript-eslint/naming-convention
        help_accessibility: false,

        // Remove the "Upgrade" link for Tiny.
        // https://www.tiny.cloud/docs/tinymce/latest/editor-premium-upgrade-promotion/
        promotion: false,

        // Allow the administrator to disable branding.
        // https://www.tiny.cloud/docs/tinymce/latest/statusbar-configuration-options/#branding
        branding: true,

        // Put th cells in a thead element.
        // https://www.tiny.cloud/docs/tinymce/latest/table-options/#table_header_type
        // eslint-disable-next-line @typescript-eslint/naming-convention
        table_header_type: 'sectionCells',

        // Stored text in non-entity form.
        // https://www.tiny.cloud/docs/tinymce/latest/content-filtering/#entity_encoding
        // eslint-disable-next-line @typescript-eslint/naming-convention
        entity_encoding: 'raw',

        // Enable browser-supported spell checking.
        // https://www.tiny.cloud/docs/tinymce/latest/spelling/
        // eslint-disable-next-line @typescript-eslint/naming-convention
        browser_spellcheck: true,

        // Disable the Alt+F12 shortcut.
        // This was introduced in Tiny 7.1 to focus notifications, but it conflicts with the German keyboard layout
        // which uses Alt+F12 to access the open curly brace.
        // This is an upstream problem with TinyMCE and should be fixed in a future release.
        // The recommended workaround is to disable the shortcut.
        // See MDL-83257 for further information.
        init_instance_callback: (editor) => {
            editor.shortcuts.remove('alt+f12');
        },

        // Highlight the editor on focus.
        // https://www.tiny.cloud/docs/tinymce/latest/content-appearance/#highlight_on_focus
        // eslint-disable-next-line @typescript-eslint/naming-convention
        highlight_on_focus: true,

        // Context menu configuration.
        // https://www.tiny.cloud/docs/tinymce/latest/menus-configuration-options/#contextmenu
        contextmenu: 'spellchecker configurepermanentpen',

        // Use filename from server for uploaded images.
        // https://www.tiny.cloud/docs/tinymce/latest/upload-images/#images_reuse_filename
        // eslint-disable-next-line @typescript-eslint/naming-convention
        images_reuse_filename: true,

        // Mobile configuration.
        // https://www.tiny.cloud/docs/tinymce/latest/tinymce-for-mobile/
        mobile: {
            // Display menu bar on tablets.
            menubar: false,

            // Position of the toolbar and menu bar.
            // https://www.tiny.cloud/docs/tinymce/latest/toolbar-configuration-options/#toolbar_location
            // eslint-disable-next-line @typescript-eslint/naming-convention
            toolbar_location: 'bottom',

            // Behaviour of the toolbar.
            // https://www.tiny.cloud/docs/tinymce/latest/toolbar-configuration-options/#toolbar_mode
            // eslint-disable-next-line @typescript-eslint/naming-convention
            toolbar_mode: 'scrolling',

            // Quickbars Image Toolbar configuration.
            // https://www.tiny.cloud/docs/tinymce/latest/quickbars/#quickbars_image_toolbar
            // eslint-disable-next-line @typescript-eslint/naming-convention
            quickbars_image_toolbar: '',

            // Quickbars Selection Toolbar configuration.
            // https://www.tiny.cloud/docs/tinymce/latest/quickbars/#quickbars_selection_toolbar
            // eslint-disable-next-line @typescript-eslint/naming-convention
            quickbars_selection_toolbar: '',

            // Hide the status bar.
            // https://www.tiny.cloud/docs/tinymce/latest/statusbar-configuration-options/#statusbar
            statusbar: false,
        },

        setup: (editor) => {
            editor.on('init', function() {
                removeSubmenuItem(editor, 'align', 'addon.tinymce.tiny:justify');
            });
        },
    };
}

/**
 * Remove the specified sub-menu item from the named section.
 * Recreate a menu with the same sub-menu items but remove the specified item.
 *
 * @param editor Editor instance.
 * @param section Section name.
 * @param submenuItem The language string of the sub-menu item.
 */
function removeSubmenuItem(editor: Editor, section: string, submenuItem: string): void {
    const menuItems = editor.ui.registry.getAll().menuItems[section];
    if (menuItems && 'getSubmenuItems' in menuItems) {
        editor.ui.registry.addNestedMenuItem(
            section,
            {
                text: menuItems.text,
                getSubmenuItems: () => {
                    const newSubmenu: ReturnType<typeof menuItems.getSubmenuItems> = [];
                    const submenuItems = [menuItems.getSubmenuItems()].flat();

                    submenuItems.forEach((item) => {
                        const itemText = typeof item === 'string' ? item : 'text' in item ? item.text : '';

                        // Need to trim the text because some of the sub-menus use space to replace an icon.
                        {if (itemText?.trim() !==  Translate.instant(submenuItem)) {
                            newSubmenu.push(item);
                        }}
                    });

                    return newSubmenu;
                },
            },
        );
    }
}
