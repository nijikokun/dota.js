# Dota.js

Advanced templating language forked from doT.js that utilizes readable and comprehensable language contexts such as `if`, `else if` and `for`, `foreach` as well as easier methods for changing the template language suffixes and prefixes.

## Features

* custom delimiters
* runtime evaluation
* runtime interpolation
* compile-time evaluation
* partials support
* conditionals support
* array iterators
* object iterators
* encoding
* control whitespace - strip or preserve
* streaming friendly
* use it as logic-less or with logic, it is up to you

## Syntax Breakdown

If you are coming from doT.js there are a few changes, but most are logically sound changes for readability and understanding quicker.

```
{{= ..code.. }}{{/ ..code.. }} is evaluation
             {{self.variable}} is interpolation
            {{!self.variable}} is encoding (encodeHTML)
      {{use def.definition /}} is usage of definition blocks and more advanced features are available as in 1.0 of doT.js
   {{def definition: value /}} is definition
        {{if variable}}{{/if}} is conditional if statement, the backslash is optional but added for readability and scanning.
{{elseif variable}}{{/elseif}} is conditional elseif statements, same as before with optional backslash

Looping:
{{foreach self.array :value:index}}{{/foreach}} is for looping through an array, supports dot.js ~ instead of foreach
            {{for self.obj :key:value}}{{/for}} is for looping through an object, custom object function if `@` after for indicator
```

`it` has been changed to `self` as seen in the breakdown above to have less confusion, you can always change this back.

You don't need `def.` on definition blocks, however on usage blocks you will need the `def` prefix. Also, if you wish to load files instead of `def.loadFile` use `dota.loadFile` inside of your `use` block.

In my opinion which isn't much, it's a lot cleaner.

## Usage

```javascript
dota.compile(String template, Object definition);
```

Sugar syntax for `dota.template` compiles and utilizes the default `dota.templateSettings` object.

* `template` **String** *Raw template code*
* `definition` **Object ** *Template variable definitions*

```javascript
dota.template(String template, Object settings, Object definition);
```

Sugar syntax for `dota.template` compiles and utilizes the default `dota.templateSettings` object.

* `template` **String** *Raw template code*
* `settings` **Object** *Custom compilation settings, upon being null uses default settings`
* `definition` **Object** *Template variable definitions, if missing*

## License

   dota.js is an open source fork of doT
   dota stands for dot-advanced, OCD made me lowercase the T.

   Licensed under the MIT license.
