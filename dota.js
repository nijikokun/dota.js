// dota.js
// 2013, Nijiko Yonskai, https://github.com/nijikokun/dota.js
// 2011, Laura Doktorova, https://github.com/olado/doT
//
// dota.js is an open source fork of doT and component of Mashape
// dota stands for dot-advanced, OCD made me lowercase the T.
//
// Licensed under the MIT license.
(function() {
  "use strict";

  var dota = {
    version: '1.0.0',
    lang: {
      prefix: "\\{\\{",
      suffix: "\\}\\}"
    },
    template: undefined, //fn, compile template
    compile:  undefined  //fn, for express
  };

  dota.wrap = function (regexp, modifiers) {
    return new RegExp(dota.lang.prefix + regexp + dota.lang.suffix, modifiers);
  };

  dota.templateSettings = {
    evaluate:     dota.wrap("(\\/|=)\\s*([\\s\\S]+?)\\s*(?:\\/)?", "g"),
    interpolate:  dota.wrap("([\\s\\S]+?)", "g"),
    encode:       dota.wrap("!\\s*([\\s\\S]+?)\\s*", "g"),
    use:          dota.wrap("use\\s*([\\s\\S]+?)\\s*(?:\\/)?", "g"),
    useParams:    /(^|[^\w$])(?:dota|def)(?:\.|\[[\'\"])([\w$\.]+)(?:[\'\"]\])?\s*\:\s*([\w$\.]+|\"[^\"]+\"|\'[^\']+\'|\{[^\}]+\})/g,
    define:       dota.wrap("def\\s*([\\w\\.$]+)\\s*(\\:|=)([\\s\\S]+?)\\s*(?:\\/)?", "g"),
    defineParams: /^\s*([\w$]+):([\s\S]+)/,
    conditional:  dota.wrap("(\\/)?(if|\\?)(\\s?else(?:\\s?if)?|\\?)?\\s*([\\s\\S]*?)\\s*", "g"),
    iterate:      dota.wrap("(\\/)?(~|foreach)\\s*(?:" + dota.lang.suffix + "|([\\s\\S]+?)\\s*\\:\\s*([\\w$]+)\\s*(?:\\:\\s*([\\w$]+)))?\\s*", "g"),
    forin:        dota.wrap("(\\/)?(?:for|\\@)(@)?\\s*(?:" + dota.lang.suffix + "|([\\s\\S]+?)\\s*\\:\\s*([\\w$]+)\\s*(?:\\:\\s*([\\w$]+)))?\\s*", "g"),
    varname: 'self',
    strip: true,
    append: true,
    selfcontained: false
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = dota;

    dota.loadfile = function (path) {
      return fs.readFileSync(process.argv[1].replace(/\/[^\/]*$/, path));
    };
  } else if (typeof define === 'function' && define.amd) {
    define(function () { return dota; });
  } else {
    (function () { return this || (0, eval)('this'); }()).dota = dota;
  }

  function encodeHTMLSource () {
    var encodeHTMLRules = { "&": "&#38;", "<": "&#60;", ">": "&#62;", '"': '&#34;', "'": '&#39;', "/": '&#47;' };
    var matchHTML = /&(?!#?\w+;)|<|>|"|'|\//g;
    return function (code) {
      return code ? code.toString().replace(matchHTML, function (m) { return encodeHTMLRules[m] || m; }) : code;
    };
  }

  String.prototype.encodeHTML = encodeHTMLSource();

  var startend = {
    append: { start: "'+(",      end: ")+'",      endencode: "||'').toString().encodeHTML()+'" },
    split:  { start: "';out+=(", end: ");out+='", endencode: "||'').toString().encodeHTML();out+='" }
  }, skip = /$^/;

  function resolveDefs (c, block, def) {
    return ((typeof block === 'string') ? block : block.toString())
    .replace(c.define || skip, function(m, code, assign, value) {
      if (code.indexOf('dota.') === 0) code = code.substring(5);
      if (code.indexOf('def.') === 0) code = code.substring(4);
      if (!(code in def)) {
        if (assign === ':') {
          if (c.defineParams) value.replace(c.defineParams, function(m, param, v) {
            def[code] = {arg: param, text: v};
          });
          if (!(code in def)) def[code]= value;
        } else {
          new Function("def", "def['"+code+"']=" + value)(def);
        }
      }
      return '';
    })
    .replace(c.use || skip, function(m, code) {
      if (c.useParams) code = code.replace(c.useParams, function(m, s, d, param) {
        console.log(s, d, param);
        if (def[d] && def[d].arg && param) {
          var rw = (d+":"+param).replace(/'|\\/g, '_');
          def.__exp = def.__exp || {};
          def.__exp[rw] = def[d].text.replace(new RegExp("(^|[^\\w$])" + def[d].arg + "([^\\w$])", "g"), "$1" + param + "$2");
          return s + "def.__exp['" + rw + "']";
        }
      });
      var v = new Function("def", "return " + code)(def);
      return v ? resolveDefs(c, v, def) : v;
    });
  }

  function unescape (code) {
    return code.replace(/\\('|\\)/g, "$1").replace(/[\r\t\n]/g, ' ');
  }

  dota.template = function (tmpl, c, def) {
    c = c || dota.templateSettings;

    var cse = c.append ? startend.append : startend.split, needhtmlencode, sid = 0, indv,
      str  = (c.use || c.define) ? resolveDefs(c, tmpl, def || {}) : tmpl;

    str = ("var out='" + (c.strip ? str.replace(/(^|\r|\n)\t* +| +\t*(\r|\n|$)/g,' ')
      .replace(/\r|\n|\t|\/\*[\s\S]*?\*\//g,''): str)
      .replace(/'|\\/g, '\\$&')
      .replace(c.conditional || skip, function(m, closing, ifcase, elsecase, code) {
        return elsecase ?
          (!closing && code ? "';}else if(" + unescape(code) + "){out+='" : "';}else{out+='") :
          (!closing && code ? "';if(" + unescape(code) + "){out+='" : "';}out+='");
      })
      .replace(c.iterate || skip, function(m, iterate, vname, iname) {
        if (closing || !iterate) return "';} } out+='";
        sid+=1; indv=iname || "i"+sid; iterate = unescape(iterate);
        return "';var arr" + sid + "=" + iterate + ";if(arr" + sid + "){var " + vname + "," + indv + "=-1,l" + sid + "=arr" + sid + ".length-1;while(" + indv + "<l" + sid + "){" +
          vname + "=arr" + sid + "[" + indv + "+=1];out+='";
      })
      .replace(c.forin || skip, function (m, closing, own, iterate, vname, kname) {
        if (closing || !iterate) return "';} } " + (own ? "} " : "") + "out+='";
        sid += 1; iterate = unescape(iterate);
        return "';var obj" + sid + "=" + iterate + ";if(obj" + sid + "){var " + kname + "," + vname + ";for(" + kname + " in obj" + sid + "){" +
          (own ? "if(obj" + sid + ".hasOwnProperty(" + kname + ")){ " : "") +
          vname + "=obj" + sid + "[" + kname + "];out+='";
      })
      .replace(c.interpolate || skip, function(m, code) {
        return cse.start + unescape(code) + cse.end;
      })
      .replace(c.encode || skip, function(m, code) {
        needhtmlencode = true;
        return cse.start + unescape(code) + cse.endencode;
      })
      .replace(c.evaluate || skip, function(m, code) {
        return "';" + unescape(code) + "out+='";
      }) + "';return out;")
      .replace(/\n/g, '\\n').replace(/\t/g, '\\t').replace(/\r/g, '\\r')
      .replace(/(\s|;|\}|^|\{)out\+='';/g, '$1').replace(/\+''/g, '')
      .replace(/(\s|;|\}|^|\{)out\+=''\+/g,'$1out+=');

    if (needhtmlencode && c.selfcontained) {
      str = "String.prototype.encodeHTML=(" + encodeHTMLSource.toString() + "());" + str;
    }

    try {
      return new Function(c.varname, str);
    } catch (e) {
      if (typeof console !== 'undefined') console.log("Could not create a template function: " + str);
      throw e;
    }
  };

  dota.compile = function(tmpl, def) {
    return dota.template(tmpl, null, def);
  };
}());