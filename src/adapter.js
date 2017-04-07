'use strict';

const _           = require('lodash');
const Promise     = require('bluebird');
const Adapter     = require('@frctl/fractal').Adapter;
const React       = require('react');
const ReactDOM    = require('react-dom/server');
const prettyPrint = require('html').prettyPrint;
const babelReg    = require('babel-register');


/*
 * Adpater options
 * ---------------
 * These options can be overridden when the adapter is set up.
 * Syntax: require('./react-adapter')({ options })
 *
 * - babelConfig:  any configuration options for babel-register
 *                 https://babeljs.io/docs/usage/babel-register/
 *
 * - renderMethod: 'renderToStaticMarkup' or 'renderToString'
 *                 https://facebook.github.io/react/docs/react-dom-server.html
 */
const DEFAULT_OPTIONS = {
  babelConfig: {
    extensions: [".jsx"],
    presets: ['es2015', 'react'],
  },
  renderMethod: 'renderToStaticMarkup',
};


/*
 * React Adapter
 * -------------
 */
class ReactAdapter extends Adapter {

  constructor(source, app, options) {
    super(null, source);
    this._app = app;

    if(options.renderMethod == 'renderToString') {
      this._renderMethod = ReactDOM.renderToString;
    }
    else {
      this._renderMethod = ReactDOM.renderToStaticMarkup;
    }
  }

  render(path, str, context, meta) {
    meta = meta || {};

    setEnv('_self', meta.self, context);
    setEnv('_target', meta.target, context);
    setEnv('_env', meta.env, context);
    setEnv('_config', this._app.config(), context);

    delete require.cache[path];
    const component = require(path);
    const element = React.createElement(component, context);
    const renderedHtml = this._renderMethod(element);
    const prettyHtml = prettyPrint(renderedHtml);

    return Promise.resolve(prettyHtml);
  }
}

function setEnv(key, value, context) {
  if (_.isUndefined(context[key]) && ! _.isUndefined(value)) {
    context[key] = value;
  }
}


/*
 * Register Babel
 * --------------
 * This hooks into import/require statements and tells Babel
 * to compile according to user-configurable options.
 *
 * Call this whenever components have been parsed so we can
 * register all Fractal handles as import module aliases.
 *
 * Makes these possible:
 *
 * import Button from '@button';
 * const Button = require('@button');
 */
function registerBabel(app, config) {
  // Extract module aliases (e.g. '@button': '/path/to/button.jsx')
  var aliases = {};
  app.components.items().forEach(function(item) {
    aliases['@' + item.handle] = item.viewPath;
  });

  // Add resolver plugin aliases to babel config
  // https://github.com/tleunen/babel-plugin-module-resolver
  _.assign(config, {
    plugins: [
      ["module-resolver", {
        "alias": aliases
      }]
    ]
  });

  // Hook up that babel
  babelReg(config);
}


/*
 * Adapter registration
 * --------------------
 */
module.exports = function(config = {}) {
  const options = _.assign({}, DEFAULT_OPTIONS, config);

  return {
    register(source, app) {
      const componentsReady = () => { registerBabel(app, options.babelConfig) };
      app.components.on('loaded', componentsReady);
      app.components.on('updated', componentsReady);

      const adapter = new ReactAdapter(source, app, options);
      return adapter;
    }
  }
};
