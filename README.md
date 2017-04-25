# React Adapter for Fractal

This adapter lets you use React as a template engine in [Fractal](http://fractal.build). It's based on Fractal's [Handlebars adapter](https://github.com/frctl/handlebars). This adapter aims to maintain a React flavor rather than achieve complete feature parity with the Handlebars adapter. The goal is to facilitate writing React components that can easily be used in other projects.

## Installation

Install the adapter via NPM:

```
npm i --save fractal-react-adapter
```

Plug it into your `fractal.js` file like so: 

```javascript
const reactAdapter = require('fractal-react-adapter')();
fractal.components.engine(reactAdapter);
fractal.components.set('ext', '.jsx');
```

The adapter uses [Babel](https://babeljs.io) to compile React components via [babel-register](https://babeljs.io/docs/usage/babel-register/) (which hooks into `require` or `import` and automatically routes those files through Babel). By default, `babel-register` is configured to compile `.jsx` files and use the `react` and `es2015` Babel presets, but you can override these with any valid `babel-register` config (see Configuration below).

```javascript
// Default babel-register config
{
  extensions: [".jsx"],
  presets: ['es2015', 'react'],
}
```

The adapter also uses `babel-plugin-module-resolver` to expose Fractal's component handles as node module names. This allows you to move a component around in the file system without worrying about rewriting your imports.

```javascript
import Button from '@button';
```

```javascript
const Button = require('@button');
```

## Configuration

These options can be overridden when the adapter is set up. 

* `babelConfig`: any valid configuration options for [babel-register](https://babeljs.io/docs/usage/babel-register/)
* `renderMethod`: `'renderToStaticMarkup'` or `'renderToString'` (see [ReactDOMServer](https://facebook.github.io/react/docs/react-dom-server.html))

```javascript
const reactAdapter = require('fractal-react-adapter')({
  babelConfig: {
    presets: ['es2015', 'react', 'stage-0']
  },
  renderMethod: 'renderToString',
});
```

## Example components

### A simple button component

```javascript
import React from 'react';
 
class Button extends React.Component {
  render() {
    return <button className={this.props.className}>{this.props.children}</button>
  }
}

module.exports = Button;
```

### A card component that uses the button

```javascript
import React from 'react';
import Button from '@button'

class Card extends React.Component {
  render() {
    return (
      <div className="card">
        <h1>{this.props.title}</h1>
        <p>{this.props.description}</p>
        <Button className="orange">{this.props.buttonText}</Button>        
      </div>
    );
  }
}

module.exports = Card;
```