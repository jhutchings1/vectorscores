const requireRoot = require('app-root-path').require
const { assetsUrl, handleUndefined } = requireRoot("render-utils.js");
const { scoreTitle } = requireRoot("_eleventy/title.js")

const partialPath = "_includes/partials/score";
const header = requireRoot(`${partialPath}/header.11ty.js`);
//const footer = requireRoot(`${partialPath}/footer.11ty.js`);

module.exports = data =>
    `<!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${ scoreTitle(data.site.title, data.title) }</title>
        <link rel="stylesheet" href="${assetsUrl(data.site, '/css/score.css')}">
        ${handleUndefined(data.inline_bravura && `<link rel="stylesheet" href="${assetsUrl(data.site, '/fonts/Bravura-woff.css')}">`)}
        <link rel="stylesheet" href="styles.css")
    </head>
    <body>
        ${header(data)}
        <main>
            <svg class="main"></svg>
            ${ data.content }
        </main>
        {% include score/footer.html %}
        {% include score/modals.html %}
        {% include score/scripts.html %}
        <script src="index.js" charset="utf-8"></script>
    </body>
    </html>`;