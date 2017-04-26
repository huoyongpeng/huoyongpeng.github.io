function extend(base, prop) {
    var newObj = {};
    for (var key in prop) {
        if (prop.hasOwnProperty(key)) {
            newObj[key] = prop[key];
        }
    }
    for (var key in base) {
        if (base.hasOwnProperty(key)) {
            newObj[key] = base[key];
        }
    }
    return newObj;
}
/**
重写创建节点代码
https://github.com/vakata/jstree/blob/master/dist/jstree.js
*/
$.jstree.core.prototype._create_prototype_node = function(){
    var _node = document.createElement('LI'), _temp1, _temp2;
    _node.setAttribute('role', 'treeitem');
    _temp1 = document.createElement('I');
    _temp1.className = 'jstree-icon jstree-ocl';
    _temp1.setAttribute('role', 'presentation');
    _node.appendChild(_temp1);
    _temp1 = document.createElement('A');
    _temp1.className = 'jstree-anchor';
    _temp1.setAttribute('href','#');
    _temp1.setAttribute('tabindex','-1');
    _temp2 = document.createElement('I');
    _temp2.className = 'jstree-icon jstree-themeicon';
    _temp2.setAttribute('role', 'presentation');
    _temp1.appendChild(_temp2);
    _node.appendChild(_temp1);

    var removeElm = document.createElement('button');
    removeElm.className = 'remove-btn';
    removeElm.innerHTML = '&times;';
    removeElm.title = '删除这个节点（包括子节点）'
    _temp1.appendChild(removeElm);
    console.log("remove");
    _temp1 = _temp2 = null;

    return _node;
};
var original_redraw_node = $.jstree.core.prototype.redraw_node;
$.jstree.core.prototype.redraw_node = function (node, deep, is_callback, force_render) {
    console.log("redraw", arguments);
    var data = this.get_node(node);

    var obj = original_redraw_node.apply(this, Array.prototype.slice.call(arguments));
    var a = $('a', obj);
    $(a[0]).addClass(data.type);
    return obj;
};

/*
针对不同的节点类型，弹出不同的右键操作列表
1. 注解节点只在根节点下展示，注解节点的子节点只能添加documentation叶节点
2. 基础类型节点是叶节点，不会有子节点，所以只展示删除和编辑
3. complexType节点下才可以添加基础类型的叶节点
*/
function getContextMenuItems(currentNode) {
    var commonItems = {
        "edit": {
            "label": "编辑",
            "action": function(data) {
                var inst = $.jstree.reference(data.reference);
                var obj = inst.get_node(data.reference);
                //inst.edit(obj);
                editNode(obj);
            }
        },
        "Delete": {
            "label": "删除节点",
            "action": function(data) {
                var ref = $.jstree.reference(data.reference),
                    sel = ref.get_selected();
                if (!sel.length) {
                    return false;
                }
                ref.delete_node(sel);

            }
        }
    };
    var addItems = {
        "addDecimal": {
            "label": "添加decimal",
            "action": function(data) {
                addNewNode(data, 'decimal');
            }
        },
        "addString": {
            "label": "添加string",
            "action": function(data) {
                addNewNode(data, 'string');
            }
        },
        "addBoolean": {
            "label": "添加boolean",
            "action": function(data) {
                addNewNode(data, 'boolean');
            }
        },
        "addComplexType": {
            "label": "添加complexType",
            "action": function(data) {
                addNewNode(data, 'complexType');
            }
        }
    };
    var annotationItem = {
        "label": "添加scheme注释",
        "action": function(data) {
            var tree = $.jstree.reference(data.reference);
            var node = {
                type: 'annotation',
                state: {
                    opened: true
                },
                text: '注释',
                data: {
                    type: 'annotation'
                }
            };
            var sel = tree.get_selected();
            if (!sel.length) {
                return false;
            }
            sel = sel[0];
            tree.create_node(sel, node, 'first');
        }
    };
    var documentationItem = {
        "label": "添加schema中的文本注释",
        "action": function(data) {
            addNewNode(data, 'documentation');
        }
    };
    var type = currentNode.type;
    var isRootNode = currentNode.parent == '#';
    if (isRootNode) {
        type = 'schema';
    }

    switch (type) {
        case 'annotation':
            return extend(commonItems, {
                documentation: documentationItem
            });
        case 'schema':
            var items = extend({
                annotation: annotationItem
            }, addItems);
            items = extend(commonItems, items);
            return items;
        case 'complexType':
            return extend(commonItems, addItems);
        case 'string':
        case 'decimal':
        case 'boolean':
            return commonItems;
        default:
            return commonItems;

    }
}

function initTree(data) {
    $('#rootNode').jstree({
        'core': {
            "check_callback": true,
            'data': data
        },
        "contextmenu": {
            "items": getContextMenuItems
        },
        "types": {
            "#": {
                "max_children": 1,
                "max_depth": 10,
                "valid_children": ["schema"]
            },
            "scheme": {
                "icon": "./images/scheme.png",
                "valid_children": ["default"]
            },
            "default": {
                "valid_children": ["default", "decimal", "string", "boolean", "annotation", "documentation", "complexType"]
            },
            decimal: {
                icon: "./images/decimal.png"
            },
            string: {
                icon: "./images/string.png"
            },
            boolean: {
                icon: "./images/boolean.png"
            },
            annotation: {
                icon: "./images/annotation.png"
            },
            documentation: {
                icon: "./images/documentation.png"
            },
            complexType: {
                icon: "./images/complexType.png"
            }
        },
        "plugins": [
            "contextmenu",
            "state",
            "types",
            "unique"
        ]
    });

    window.hugo = $('#rootNode').jstree();
}
//创建新节点的时候需要用户输入的属性配置
var propertiesMap = {
    string: [{
            type: 'text',
            name: 'pattern',
            label: '模式',
            placeholder: 'pattern'
        },
        {
            type: 'text',
            name: 'minLength',
            label: '最小长度',
            placeholder: 'minLength'
        },
        {
            type: 'text',
            name: 'maxLength',
            label: '最大长度',
            placeholder: 'maxLength'
        }
    ],
    decimal: [{
            type: 'text',
            name: 'minInclusive',
            label: '最小值',
            placeholder: 'minInclusive'
        },
        {
            type: 'text',
            name: 'maxInclusive',
            label: '最大值',
            placeholder: 'maxInclusive'
        }
    ],
    boolean: [{
        type: 'select',
        name: 'value',
        label: '值',
        options: ['True', 'False']
    }],
    complexType: [],
    /*
    annotation: [{
        type: 'text',
        name: 'appinfo',
        label: 'appinfo',
        placeholder: 'appinfo'
    }],
    */
    documentation: [{
        type: 'text',
        name: 'name',
        label: 'annotation文本注释',
        placeholder: 'documentation'
    }]
};

//根据不同的type来生成不同的输入对话框
function getPropertiesContainer(type) {
    var properties = propertiesMap[type];
    if (properties == null) {
        console.error('invalid type ' + type);
        return null;
    }
    var container = document.createElement('ul');
    //这些输入框是通用的
    var common = [{
            type: 'text',
            name: 'name',
            label: '名称',
            placeholder: '名称'
        }
    ];
    if(type != 'complexType') {
        common = common.concat([{
            type: 'text',
            name: 'maxOccurs',
            label: '出现次数最大值',
            placeholder: 'maxOccurs'
        },
        {
            type: 'text',
            name: 'minOccurs',
            label: '出现次数最小值',
            placeholder: 'minOccurs'
        }]);
    }
    if (type != 'documentation') {
        var arr = common.concat(properties);
    } else {
        var arr = properties;
    }

    arr.forEach(function(item) {
        var itemNode = document.createElement('li');
        var labelNode = document.createElement('label');
        itemNode.appendChild(labelNode);
        container.appendChild(itemNode);
        labelNode.innerText = item.label;
        if (item.type === 'select') {
            var selectNode = document.createElement('select');
            selectNode.name = item.name;
            itemNode.appendChild(selectNode);
            item.options.forEach(function(option) {
                var optionNode = document.createElement('option');
                optionNode.value = option;
                optionNode.text = option;
                selectNode.appendChild(optionNode);
            });
        } else if (item.type === 'text') {
            var inputNode = document.createElement('input');
            inputNode.name = item.name;
            inputNode.placeholder = item.placeholder;
            itemNode.appendChild(inputNode);
        }
    });
    return container;
}
//当前正在编辑的节点
var currentEditedNode;
//弹出新建节点的输入对话框
function openPropertiesContainer(type, node) {

    var container = getPropertiesContainer(type);
    var typeNode = document.createElement('input');
    typeNode.value = type;
    typeNode.type = 'hidden';
    typeNode.name = 'type';
    console.info(data);
    $('#propertiesNode').empty().append(typeNode).append(container);
    if(node && node.data) {
        var data = node.data;
        var form = $('#propertiesNode').parent()[0];
        for(var key in data) {
            if(typeof data[key] != 'undefined') {
                form[key].value = data[key];
            }
        }
        $('input[type=submit]').val('保存节点更改');
        currentEditedNode = node;
    }else{
        $('input[type=submit]').val('添加节点');
        currentEditedNode = null;
    }
}

//在树上添加节点
function addNode(tree, node) {

    var sel = tree.get_selected();
    if (!sel.length) {
        return false;
    }
    sel = sel[sel.length - 1];
    tree.create_node(sel, node);
}

function addNewNode(data, type) {
    openPropertiesContainer(type);
}

function editNode(node) {
    openPropertiesContainer(node.type, node);
}


/** start of  尝试从xsd文件转换为渲染tree用的json
=============================================
*/

function bridge(obj, key, parentNode) {
    //console.log(obj, key, parentNode);
    var name = obj._name;
    var node;

    if (name) {
        node = {
            text: name,
            children: []
        };
    } else {
        node = parentNode;
    }
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            var value = obj[key];
            if (value !== null && typeof(value) == "object") {
                var childNode = bridge(value, key, node);
                if (childNode) {
                    node.children.push(childNode);
                }
            }

        }

    }
    if (node != parentNode && node.name) {
        return node;
    }
    return null;
}
/** end of  尝试从xsd文件转换为渲染tree用的json
=============================================
*/

function getJsonFromForm(form) {
    var json = {};
    for (var i = 0; i < form.elements.length; i++) {
        var node = form.elements[i];
        if (node.type == 'submit') {
            continue;
        }
        json[node.name] = node.value;
    }
    return json;
}

//绑定表单的“添加节点”按钮，当用户点击这个按钮后，在树上执行创建节点操作
function initForm() {
    $('#propertiesNode').parent().on('submit', function(e) {
        e.preventDefault();
        var tree = $('#rootNode').jstree();
        var type = this.type.value;
        var json = getJsonFromForm(this);
        var node = {
            type: this.type.value,
            state: {
                opened: true
            },
            data: json
        };
        delete json.name;
        node.text = this.name.value + JSON.stringify(json);
        json.name = this.name;
        if(currentEditedNode){
            tree.rename_node(currentEditedNode.id, node.text);
            currentEditedNode.data = json;
        }else{
            addNode(tree, node);
        }
        
    });
}

function refactorNodeName(item) {
    item.data.type = item.type;
    var dataJsonStr = JSON.stringify(item.data);
    item.data.name = item.text;
    item.text += dataJsonStr;
    
    item.children && item.children.forEach(function(child) {
        refactorNodeName(child);
    });
}

function initExport(){
    $('#export').click(function(){
        exportXML();
    });
}

function initRemoveBtn (){
    $('#rootNode').click(function(e){
        if(e.target.className == 'remove-btn') {
            var id = $(e.target).parent().parent().attr('id');
            var tree = $('#rootNode').jstree();
            tree.delete_node(id);
        }
    });
}
var XML_STR = '<?xml version="1.0"?><xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"><xs:element name="stringNode"><xs:simpleType><xs:restriction base="xs:string"><xs:maxLength value="70"/><xs:pattern value="a-z"/></xs:restriction></xs:simpleType></xs:element><xs:element name="complexTypeNode"><xs:complexType><xs:sequence><xs:element name="hugo"><xs:simpleType><xs:restriction base="xs:string"><xs:minLength value="10"/><xs:maxLength value="40"/><xs:pattern value="a-z"/><xs:maxOccurs value="2"/><xs:minOccurs value="1"/></xs:restriction></xs:simpleType></xs:element><xs:element name="balls"><xs:complexType><xs:sequence><xs:element name="age"><xs:simpleType><xs:restriction base="xs:decimal"><xs:minInclusive value="10"/><xs:maxInclusive value="100"/><xs:maxOccurs value="2"/><xs:minOccurs value="5"/></xs:restriction></xs:simpleType></xs:element></xs:sequence></xs:complexType></xs:element></xs:sequence></xs:complexType></xs:element><xs:element name="plane"><xs:complexType><xs:sequence><xs:element name="boeing"><xs:simpleType><xs:restriction base="xs:string"><xs:minLength value="10"/><xs:maxLength value="20"/><xs:pattern value="a-zA-Z"/><xs:maxOccurs value="0"/><xs:minOccurs value="100"/></xs:restriction></xs:simpleType></xs:element></xs:sequence></xs:complexType></xs:element><xs:element name="isBiggest"><xs:simpleType><xs:restriction base="xs:boolean"><xs:maxOccurs value="1"/><xs:minOccurs value="20"/></xs:restriction></xs:simpleType></xs:element></xs:schema>';
function init() {
    var data = xmlToJSON(XML_STR);
    refactorNodeName(data);
    initTree(data);
    initForm();
    initRemoveBtn();
    initExport();
}

$(init);