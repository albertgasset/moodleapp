TinyMCE addon for the Moodle App
================================

Setup instructions
------------------

1. Copy all addon files to the directory `src/addons/tinymce`.

2. Install the required version of the TinyMCE package:
    ```
    npm install --save-exact tinymce@7.3.0
    ```

3. Modify `scripts/copy-assets.js` to call the script that copies the TinyMCE assets:
    ```
    // ...

    module.exports = function (ctx) {
        // ...

        // Add the next line at the end of the function.
        require("../src/addons/tinymce/scripts/copy-assets")(ctx);
    };
    ```

4. Modify `src/theme/theme.scss` to import the needed SCSS file:
    ```
    /* ... */

    /* Add the next line at the end of the file */
    @import "../addons/tinymce/theme/tinymce.scss";
    ```

5. Update the `langindex.json` file:
    ```
    npm run lang:create-langindex
    ```
