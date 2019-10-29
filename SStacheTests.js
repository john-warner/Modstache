test('Test assertions are working', function (assert) {
    var result = [];
    var expected = [];
    assert.deepEqual(result, expected);
}); // use deepEqual for arrays see: https://api.qunitjs.com/deepEqual/

const fragmentHtml = (f) => [...f.childNodes].map(n => n.outerHTML).join('\n');

test('Test html without mustache values', function (assert) {
    var html = "<div></div>";
    var result = fragmentHtml($$tache.fill(html));
    var expected = html;
    assert.deepEqual(result, expected);
});

test('Test html with mustache values', function (assert) {
    var html = "<div>{{value}}</div>";
    var data = { value: 'Working!' };
    var result = fragmentHtml($$tache.fill(html, data));
    var expected = "<div>Working!</div>";
    assert.deepEqual(result, expected);
});

test('Test with missing data values', function (assert) {
    var html = "<div>{{value}}</div>";
    var data = { };
    var result = fragmentHtml($$tache.fill(html, data));
    var expected = html;
    assert.deepEqual(result, expected);
});

test('Test with enabled inserted script', function (assert) {
    var html = "<div>{{value}}</div>";
    var data = { value: '<script>log.console("scripted");</script>' };
    var result = fragmentHtml($$tache.fill(html, data, { escape: false }));
    var expected = "<div><script>log.console(\"scripted\");</script></div>";
    assert.deepEqual(result, expected);
});

test('Test with disabled inserted script', function (assert) {
    var html = "<div>{{value}}</div>";
    var data = { value: '<script>log.console("scripted");</script>' };
    var result = fragmentHtml($$tache.fill(html, data, { escape: true }));
    var expected = "<div>&lt;script&gt;log.console(\"scripted\");&lt;/script&gt;</div>";
    assert.deepEqual(result, expected);
});

test('Test with dom fragment', function (assert) {
    var html = '<div ss="value">{{value}}</div>';
    var template = document.createElement("template");
    var data = { value: 'Hello' };

    template.innerHTML = html;
    $$tache.fill(template.content, data, { removess: true });

    var result = template.innerHTML;
    var expected = "<div>Hello</div>";
    assert.deepEqual(result, expected);
});

test('Test dom fragment translation', function (assert) {
    var html = '<div ss="value">{{value}}</div>';
    var template = document.createElement("template");
    var data = { value: { text: 'Hello' } };
    var translate = { text: 'textContent' };

    template.innerHTML = html;
    $$tache.fill(template.content, data, { translate: translate, removess: true });

    var result = template.innerHTML;
    var expected = "<div>Hello</div>";
    assert.deepEqual(result, expected);
});

test('Test dom fragment attribute setting', function (assert) {
    var html = '<div ss="value" class="">{{value}}</div>';
    var template = document.createElement("template");
    var data = { value: { class: 'bold', textContent: 'Hello' } };

    template.innerHTML = html;
    $$tache.fill(template.content, data, { removess: true });

    var result = template.innerHTML;
    var expected = '<div class="bold">Hello</div>'
    assert.deepEqual(result, expected);
});

test('Test dom fragment multiple attributes', function (assert) {
    var html = '<div ss="value;class:class" class="">{{value}}</div>';
    var template = document.createElement("template");
    var data = { value: 'Hello', class: 'bold' };

    template.innerHTML = html;
    $$tache.fill(template.content, data, { removess: true });

    var result = template.innerHTML;
    var expected = '<div class="bold">Hello</div>'
    assert.deepEqual(result, expected);
});

test('Test setting event handler', function (assert) {
    let html = '<div ss="onclick:click">Hello</div>';
    let template = document.createElement("template");
    let onclick = () => { alert('clicked'); }
    let data = { click: () => onclick };

    template.innerHTML = html;
    $$tache.fill(template.content, data);
  
    var result = template.content.children[0].onclick;
    var expected = onclick;
    assert.deepEqual(result, expected);
});
