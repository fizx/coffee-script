// converts json grammar format to Jison grammar format

function json2jison (grammar) {
    var s = "";

    s += genDecls(grammar);
    s += genBNF(grammar.bnf);

    return s;
}

function genDecls (grammar) {
    var s = "",
        key;

    for (key in grammar) if (grammar.hasOwnProperty(key)) {
        if (key === 'start') {
            s += "\n%start "+grammar.start+"\n\n";
        }
        if (key === 'author') {
            s += "\n/* author: "+grammar.author+" */\n\n";
        }
        if (key === 'comment') {
            s += "\n/* description: "+grammar.comment+" */\n\n";
        }
        if (key === 'operators') {
            for (var i=0; i<grammar.operators.length; i++) {
                s += "%"+grammar.operators[i][0]+' '+quoteSymbols(grammar.operators[i].slice(1).join(' '))+"\n";
            }
            s += "\n";
        }
    }

    return s;
}

function genBNF (bnf) {
    var s = "%%\n",
        sym;

    for (sym in bnf) if (bnf.hasOwnProperty(sym)) {
        s += ["\n",sym,'\n    : ', genHandles(bnf[sym]),"\n    ;\n"].join("");
    }

    return s;
}

function genHandles (handle) {
    if (typeof handle === 'string') {
        return handle;
    } else { //array
        var s = "";
        for (var i=0; i< handle.length;i++) {
            if (typeof handle[i] === 'string' && handle[i]) {
                s += quoteSymbols(handle[i]);
            } else if (handle[i] instanceof Array) {
                s += (handle[i][0] && quoteSymbols(handle[i][0]));
                if (typeof handle[i][1] === 'string') {
                    s += handle[i][1].match(/\}/) ? 
                        "\n        {{"+handle[i][1]+(handle[i][1].match(/\}$/) ? ' ' : '')+"}}" :
                        "\n        {"+handle[i][1]+"}";
                    if (handle[i][2] && handle[i][2].prec) {
                        s += " %prec "+handle[i][2].prec;
                    }
                } else if (handle[i][1].prec) {
                    s += " %prec "+handle[i][1].prec;
                }
            }
            if (typeof handle[i+1] !== 'undefined')
                s += "\n    | ";
        }
        return s;
    }
}

function quoteSymbols (rhs) {
    rhs = rhs.split(' ');

    for (var i=0; i<rhs.length; i++) {
        rhs[i] = quoteSymbol(rhs[i]);
    }
    return rhs.join(' ');
}

function quoteSymbol (sym) {
    if (!/[a-zA-Z][a-zA-Z0-9_-]*/.test(sym)) {
        var quote = /'/.test(sym) ? '"' : "'";
        sym = quote+sym+quote;
    }
    return sym;
}


// Generate lex format from lex JSON

function genLex (lex) {
    var s = [];

    if (lex.macros) {
        for (var macro;macro=lex.macros.shift();) {
            s.push(macro[0], '\t\t', macros[1], '\n');
        }
    }
    if (lex.actionInclude) {
        s.push('\n%{\n', lex.actionInclude, '\n%}\n');
    }
    s.push('\n%%\n');
    if (lex.rules) {
        for (var rule;rule=lex.rules.shift();) {
            s.push(rule[0], '    ', genLexRule(rule[1]), '\n');
        }
    }
    s.push('\n%%\n');

    return s.join('');
}

function genLexRule (rule) {
    return rule.match(/\\}/) ? '%{'+rule+'}%' : '{'+rule+'}';
}

exports.json2jison = json2jison;
exports.convert = json2jison;

exports.main = function main (args) {
    var fs = require("file");
        gfile = fs.path(fs.cwd()).join(args[1]),
        grammar = JSON.parse(gfile.read({charset: "utf-8"}));

    if (grammar.bnf) {
        var fname = fs.path(fs.cwd()).join(gfile.basename(".json") + ".jison"),
            stream = fname.open("w");
        stream.print(json2jison(grammar));
        stream.close();
    }

    var lex = grammar.lex || grammar.rules && grammar;

    if (lex) {
        var fname = fs.path(fs.cwd()).join(gfile.basename(".json").replace(/[._]?lex$/,'') + ".jisonlex"),
            stream = fname.open("w");
        stream.print(genLex(lex));
        stream.close();
    }
};

