var page = require('page')

var Lay = require('./lay')

var App = function (options) {
    this.self = options.self
    this.from = options.from
    this.resolve = options.resolve || function (layout) {
        return options.self + '/layouts/' + layout + '.html'
    }
    this.dependencies = options.dependencies
}

App.prototype.lay = function (options) {
    var app = this
    return function (name) {
        var path = app.resolve(name)
        var layout = require(path)
        if (!layout) {
            throw new Error('Layout ' + name + ' cannot be found at ' + path)
        }
        return new Lay(layout, options)
    }
}

module.exports = function (options) {
    var dependency;
    var parts;
    var index;
    var name;
    var module;
    var dependencies = {};

    var component = JSON.parse(require(options.self + '/component.json'));
    var dependencies = component.dependencies;
    for (dependency in dependencies) {
        if (dependencies.hasOwnProperty(dependency)) {
            parts = dependency.split('/');
            index = dependency.indexOf('/');
            name = parts[1];
            module = dependency.replace('/', '~') + '@' + dependencies[dependency];
            dependencies[name] = module;
            if (parts[0] !== options.from) {
                continue;
            }
            require(module);
        }
    }
    options.dependencies = dependencies

    return new App(options)
}
