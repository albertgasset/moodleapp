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

/**
 * Script to copy TinyMCE assets to the www folder.
 */

const fse = require("fs-extra");

const ASSETS = [
    "icons/default/icons.min.js",
    "models/dom/model.min.js",
    "plugins/anchor/plugin.min.js",
    "plugins/charmap/plugin.min.js",
    "plugins/code/plugin.min.js",
    "plugins/codesample/plugin.min.js",
    "plugins/directionality/plugin.min.js",
    "plugins/emoticons/js/emojiimages.min.js",
    "plugins/emoticons/js/emojis.min.js",
    "plugins/emoticons/plugin.min.js",
    "plugins/fullscreen/plugin.min.js",
    "plugins/help/js/i18n/keynav/ar.js",
    "plugins/help/js/i18n/keynav/bg_BG.js",
    "plugins/help/js/i18n/keynav/ca.js",
    "plugins/help/js/i18n/keynav/cs.js",
    "plugins/help/js/i18n/keynav/da.js",
    "plugins/help/js/i18n/keynav/de.js",
    "plugins/help/js/i18n/keynav/el.js",
    "plugins/help/js/i18n/keynav/en.js",
    "plugins/help/js/i18n/keynav/es.js",
    "plugins/help/js/i18n/keynav/eu.js",
    "plugins/help/js/i18n/keynav/fa.js",
    "plugins/help/js/i18n/keynav/fi.js",
    "plugins/help/js/i18n/keynav/fr_FR.js",
    "plugins/help/js/i18n/keynav/he_IL.js",
    "plugins/help/js/i18n/keynav/hi.js",
    "plugins/help/js/i18n/keynav/hr.js",
    "plugins/help/js/i18n/keynav/hu_HU.js",
    "plugins/help/js/i18n/keynav/id.js",
    "plugins/help/js/i18n/keynav/it.js",
    "plugins/help/js/i18n/keynav/ja.js",
    "plugins/help/js/i18n/keynav/kk.js",
    "plugins/help/js/i18n/keynav/ko_KR.js",
    "plugins/help/js/i18n/keynav/ms.js",
    "plugins/help/js/i18n/keynav/nb_NO.js",
    "plugins/help/js/i18n/keynav/nl.js",
    "plugins/help/js/i18n/keynav/pl.js",
    "plugins/help/js/i18n/keynav/pt_BR.js",
    "plugins/help/js/i18n/keynav/pt_PT.js",
    "plugins/help/js/i18n/keynav/ro.js",
    "plugins/help/js/i18n/keynav/ru.js",
    "plugins/help/js/i18n/keynav/sk.js",
    "plugins/help/js/i18n/keynav/sl_SI.js",
    "plugins/help/js/i18n/keynav/sv_SE.js",
    "plugins/help/js/i18n/keynav/th_TH.js",
    "plugins/help/js/i18n/keynav/tr.js",
    "plugins/help/js/i18n/keynav/uk.js",
    "plugins/help/js/i18n/keynav/vi.js",
    "plugins/help/js/i18n/keynav/zh_CN.js",
    "plugins/help/js/i18n/keynav/zh_TW.js",
    "plugins/help/plugin.min.js",
    "plugins/insertdatetime/plugin.min.js",
    "plugins/lists/plugin.min.js",
    "plugins/nonbreaking/plugin.min.js",
    "plugins/pagebreak/plugin.min.js",
    "plugins/quickbars/plugin.min.js",
    "plugins/save/plugin.min.js",
    "plugins/searchreplace/plugin.min.js",
    "plugins/table/plugin.min.js",
    "plugins/visualblocks/plugin.min.js",
    "plugins/visualchars/plugin.min.js",
    "plugins/wordcount/plugin.min.js",
    "skins/content/dark/content.min.css",
    "skins/content/default/content.min.css",
    "skins/ui/oxide-dark/content.inline.min.css",
    "skins/ui/oxide-dark/content.min.css",
    "skins/ui/oxide-dark/skin.min.css",
    "skins/ui/oxide-dark/skin.shadowdom.min.css",
    "skins/ui/oxide/content.inline.min.css",
    "skins/ui/oxide/content.min.css",
    "skins/ui/oxide/skin.min.css",
    "skins/ui/oxide/skin.shadowdom.min.css",
    "themes/silver/theme.min.js",
    "tinymce.min.js",
];

module.exports = function (ctx) {
    const tinymcePath = ctx.project.dir + "/node_modules/tinymce/";
    const assetsPath = ctx.project.srcDir + "/assets/lib/tinymce/";

    for (const src of ASSETS) {
        fse.copySync(tinymcePath + src, assetsPath + src, { overwrite: true });
    }
};
