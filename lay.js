var Lay = function (app, layout, options) {
    this.app = app
    this.layout = layout
    this.active = null
    this.stack = []
    this.cleaners = []
}

Lay.prototype.area = function (area) {
    this.active = area
    return this
}

Lay.prototype.add = function (component, options) {
    this.stack.push({
        area: this.active,
        component: component,
        options: options
    })
    return this
}

Lay.prototype.out = function (ctx, next) {
    var lay = this
    var stack = lay.stack
    dust.renderSource(lay.layout, {}, function (err, html) {
        if (err) {
            return next(err);
        }
        var tasks = [];
        var el = $(html);
        stack.forEach(function (o) {
            tasks.push(function (done) {
                var component = require(lay.app.dependencies[o.component]);
                var area = $(o.area, el);
                component($('<div class="sandbox ' + o.component + '"></div>').appendTo(area), o.options, function (err, options) {
                    if (err) {
                        return done(err)
                    }
                    console.log('2:' + o.component)
                    done(null, {component: o.component, options: options})
                });
            });
        });
        console.log('1')
        async.parallel(tasks, function (err, results) {
            if (err) {
                return next(err);
            }
            lay.cleaners.forEach(function (clean) {
                clean();
            });
            lay.cleaners = [];
            $('#content').html(el);
            results.forEach(function (result) {
                var options = result.options
                if (!options.clean) {
                    return next(new Error('\'clean\' callback cannot be found for the component ' + result.component))
                }
                lay.cleaners.push(options.clean);
                if (options.ready) {
                    options.ready();
                }
            });
            next();
        });
    });
    return this;
};

module.exports = Lay
