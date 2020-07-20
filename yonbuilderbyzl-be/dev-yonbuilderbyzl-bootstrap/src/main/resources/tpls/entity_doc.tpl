<!DOCTYPE html>
<html>
<head>
<meta http-equiv=Content-Type content="text/html; charset=utf-8">
<title>类型属性文档</title>
<link href="../css/main.css" type="text/css" rel="stylesheet">
</head>
<body>
<div class="menu">
[<a href="../index.html">HOME</a>]
</div>
<h1 class="center">类型属性</h1>
<div class="layer1">
<div class="layer2 hence">
<h2 class="center"><#=title#>(<#=owner.moduleName#>.<#=owner.name#>.<#=name#>)</h2>
<#?(isEnumeration!=true){#>
<div class="description">
<#?(parent!=null)#>继承&nbsp;<#@JavaTypeBuilder,parent#>&nbsp;<#}#><#?(suppliers._size>0)#>实现接口&nbsp;<