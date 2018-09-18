var Lay = function (layout, options) {
    this.layout = layout
    this.area = null
    this.stack = []
}

Lay.prototype.area = function (area) {
    this.area = area
    return this
}

Lay.prototype.add = function (component, options) {
    this.stack.push({
        area: this.area,
        component: component,
        options: options
    })
    return this
}

Lay.prototype.out = function (ctx, next) {
    var lay = this
    var stack = lay.stack
    dust.renderSource(layout, {}, function (err, html) {
        if (err) {
            return next(err);
        }
        var tasks = [];
        var el = $(html);
        stack.forEach(function (o) {
            tasks.push(function (done) {
                var component = require(lay.dependencies[o.]);
                var area = $(o.sel, el);
                component($('<div class="sandbox ' + o.component + '"></div>').appendTo(area), o.options, function (err, options) {
                    if (err) {
                        return done(err)
                    }
                    done(null, {component: component, options: options})
                });
            });
        });
        async.parallel(tasks, function (err, results) {
            if (err) {
                return next(err);
            }
            cleaners.forEach(function (clean) {
                clean();
            });
            cleaners = [];
            $('#content').html(el);
            results.forEach(function (result) {
                var options = result.options
                if (!options.clean) {
                    return next(new Error('\'clean\' callback cannot be found for the component ' + result.component))
                }
                cleaners.push(options.clean);
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
