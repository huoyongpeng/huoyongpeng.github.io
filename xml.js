//从树种获取json
function getJsonFromTree(tree) {
    var data = tree.get_json('#', {
        no_state: true,
        no_id: true,
        no_li_attr: true,
        no_a_attr: true
    })[0];
    return data;
}
//将从树中获取的json格式化为生成xsd需要的格式
function refactor(json) {
    var newJson = {
        children: []
    };
    var data = json.data;
    for (var key in data) {
        if (data.hasOwnProperty(key)) {
            newJson[key] = data[key];
        }
    }
    json.children && json.children.forEach(function(child) {
        newJson.children.push(refactor(child));
    });
    return newJson;
}

//基础类型：string, decimal, boolean
function getSimpeTypeElement(json) {
    var restrictions = [];
    var keys = ['minInclusive', 'maxInclusive', 'minLength', 'maxLength', 'pattern', 'maxOccurs', 'minOccurs'];
    keys.forEach(function(key) {
        var value = json[key];
        if (typeof value !== 'undefined') {
            restrictions.push('<xs:' + key + ' value="' + value + '"/>');
        }
    });
    var str =
        '<xs:element name="' + json.name + '">' +
        '<xs:simpleType>' +
        '<xs:restriction base="xs:' + json.type + '">' +
        restrictions.join('') +
        '</xs:restriction>' +
        '</xs:simpleType>' +
        '</xs:element>';
    return str;
}

//复杂类型，可以有子节点（调用里有递归）
function getComplexTypeElement(json) {
    var str = '<xs:element name="' + json.name + '">' +
        '<xs:complexType>' +
        '<xs:sequence>';
    json.children.forEach(function(child) {
        str += getElementsFromJson(child);
    });
    str +=
        '</xs:sequence>' +
        '</xs:complexType>' +
        '</xs:element>';
    return str;
}

//注解（调用里有递归）
function getAnnotation(json) {
    var str = '<xs:annotation>';
    json.children.forEach(function(child) {
        str += getElementsFromJson(child);
    });
    str += '</xs:annotation>';
    return str;
}
//注解的子节点 documentation
function getDocumentation(json) {
    var str =
        '<xs:documentation xml:lang="en">' +
        json.name +
        '</xs:documentation>';
    return str;
}

//测试用的json结构
var TEST_JSON = {
    "type": "complexType",
    "name": "root",
    "children": [{
        "children": [{
            "children": [],
            "type": "integer",
            "name": "price",
            "minInclusive": "15",
            "maxInclusive": "20"
        }, {
            "children": [],
            "type": "integer",
            "name": "weight",
            "minInclusive": "150",
            "maxInclusive": "500"
        }],
        "length": 30,
        "maxLength": 70,
        "pattern": "a-z"
    }, {
        "children": [{
            "children": [],
            "type": "integer",
            "name": "age",
            "minInclusive": "50",
            "maxInclusive": "100"
        }],
        "type": "complexType",
        "name": "root",
        "minInclusive": 34,
        "maxInclusive": 50
    }]
};
var schema = '<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">';

//获取生成xsd用的中间代码结构（不包括根元素，因为根节点可以是固定值)
function getElementsFromJson(json) {
    var type = json.type;
    var properties = [];
    var str;
    console.info(type);
    switch (type) {
        case 'string':
        case 'boolean':
        case 'decimal':
            return getSimpeTypeElement(json);
        case 'complexType':
            return getComplexTypeElement(json);
        case 'annotation':
            return getAnnotation(json);
            break;
        case 'documentation':
            return getDocumentation(json);

    }
    /*
    if(json.children && json.children.length > 0){
        json.children.forEach(function(child){
            str += getElementsFromJson(child);
        });
    }*/
    return str;
}

//组合根节点和中间节点
function jsonToXSD(str) {
    var xmlStr = '<?xml version="1.0"?>' + schema + str + '</xs:schema>';
    console.log(xmlStr);
    var xml = $.parseXML(xmlStr);
    return xml;
}

//输出xsd结构
function exportXML() {
    var json = getJsonFromTree(hugo);
    console.log(json);
    var refactoredJson = refactor(json);
    var str = '';
    refactoredJson.children.forEach(function(child) {
        str += getElementsFromJson(child);
    });
    return jsonToXSD(str);
}