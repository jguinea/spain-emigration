//TODO
// Añadir interactividad del tiempo

var viewWidth = window.innerWidth;
var viewHeight = window.innerHeight;
var test = d3.select("#test");

var margin = {top: 60, right: 20, bottom: 60, left: 40};
var width = viewWidth - margin.left - margin.right;
var height = viewHeight - margin.top - margin.bottom;
//test.select("p")
//  .text("TEST--window height: " + height);
var padding_leyend = height/20;
//test.append("p").text("padding_leyend: "+padding_leyend);
var leyend_height = height/70;
var leyend_width = width/4 - (padding_leyend * 2);
//test.append("p").text("leyend_width: "+leyend_width);
//var padding = 15; not used??
d3.select(window).on('resize', resize); //zoom

const semestres = ["2018S2","2018S1","2017S2","2017S1","2016S2","2016S1","2015S2","2015S1","2014S2","2014S1","2013S2","2013S1","2012S2","2012S1","2011S2","2011S1","2010S2","2010S1","2009S2","2009S1","2008S2","2008S1"]
var type = "flujo"

//Esta es la proyeccion sobre la que se coloca la geometría del mapa
var projection = d3.geoConicConformalSpain()
  .translate([width / 3.5, height / 2]);
// Añadir la proyección al path
var path = d3.geoPath().projection(projection);

//tamaño de la proyeccion
var scale = height/0.2;
projection.scale(scale);
 // .translate([width / 2, height / 2]);

var svg = d3.select("body").append("svg")
  .attr("width", width)
  .attr("height", height)
  .attr("id","map");

//Guardar info de geometría
provincias = geodata

//JSON importado en el html 
var data = emigration_data

//Datos para Madrid (estático)
var num_prov_selected = 28;
var lista_destinos = get_destinos(num_prov_selected,data);
var semestre= "total";
domain = get_domain(num_prov_selected,lista_destinos,semestre);

//Escala de colores
var myColorFlow = d3.scaleLinear()
  .domain(domain)
  .range(["#e6ffe6","#008000"]);

var myColorNet = d3.scaleDiverging() //NI PUTA IDEA DE ESTO
  .domain(d3.extent(net_provinces,d => d["net_migration"]))
  .range["blue","white","red"];


//Dibujarlo todo
draft_map();
//draw_map(num_prov_selected,lista_destinos,semestre);
button_listner();

//Mapa base
function draft_map() {
  svg.selectAll("path")
    .data(provincias.features)
    // features es la lista de provincias
    .enter().append("path")
    .attr("d", path)
    .attr("class","map")
    .style("fill", "white");
}


//Dibujar el mapa
function draw_map(type,num_prov_selected,lista_destinos,semestre){

  if(type=="urbanizacion"){
    ////FALTA AÑADIR CODIGO COLORES
    $("#where").text("");
    $("#who").text("");
    name_prov_selected = nombres_provincias.find(obj => obj.id == num_prov_selected)["nm"];

    svg.selectAll("path")
      .data(provincias.features)
      // features es la lista de provincias
      .enter().append("path")
      .attr("d", path)
      .attr("class","map")
      .style("fill",function(d){
        try {
          var rural=rurality.find(element => element["codigo"]==parseInt(d["properties"]["cod_prov"]))["ruralidad"]
        }
        catch(error) {
          
        }
        if(rural=="PU")
          return "#780116";
        if(rural=="PR")
          return "#efde6a";
        if(rural=="IN")
          return "#e65634";
      })
      .on("mouseover",function(d) {
        num_prov_selected = d["properties"]["cod_prov"];
        name_prov_selected = nombres_provincias.find(obj => obj.id == num_prov_selected)["nm"];
        try {
          var rural=rurality.find(element => element["codigo"]==parseInt(d["properties"]["cod_prov"]))["ruralidad"]
        }
        catch(error) {
          console.error(d["properties"]["cod_prov"]);
        }
        switch (rural) {
          case "PU": 
            rural_text = "primarily urban";
            break;
          case "PR": 
            rural_text = "primarily rural";
            break;
          case "IN": 
            rural_text = "intermidiate";
            break;
        }
        d3.select(this)
          .style("fill","#222831");
        $("#who").text(name_prov_selected +" is " + rural_text + ".");
      })
      .on("mouseout",function(d){
        d3.select(this)
        .style("fill",function(d){
          try {
            var rural=rurality.find(element => element["codigo"]==parseInt(d["properties"]["cod_prov"]))["ruralidad"]
          }
          catch(error) {
            console.error(d["properties"]["cod_prov"]);
          }
          if(rural=="PU")
            return "#780116"
          if(rural=="PR")
            return "#efde6a"
          if(rural=="IN")
            return "#e65634"
        })
      });
  }
  
  if(type=="flujo"){
    $("#who").text("");
    name_prov_selected = nombres_provincias.find(obj => obj.id == num_prov_selected)["nm"];
    total = get_total(lista_destinos,semestre)
    $("#where").text("Peña que huye de "+name_prov_selected+": "+total)
    
    svg.selectAll("path")
      .data(provincias.features)
      // features es la lista de provincias
      .enter().append("path")
      .attr("d", path)
      .attr("class","map")
      .style("fill",function(d){
        return getColorFlow(d["properties"]["cod_prov"],num_prov_selected,semestre);
      })
      .on("mouseover",function(d) {
        name_destino = d["properties"]["name"]
        numEmmigrants = getNumEmmigrants(d["properties"]["cod_prov"],lista_destinos,semestre)
        d3.select(this)
          .style("fill","#222831")
          $("#who").text("Peña de "+name_prov_selected+" a "+name_destino+": "+numEmmigrants)
      })
      .on("mouseout",function(d){
        d3.select(this)
        .style("fill",function(d){
          return getColorFlow(d["properties"]["cod_prov"],num_prov_selected,semestre);
        })
      })
      .on("click",function(d){
        lista_destinos_new=get_destinos(d["properties"]["cod_prov"],data)
        update_map(type,d["properties"]["cod_prov"],lista_destinos_new,semestre)
      })
  }

  if(type=="saldo") {
    $("#where").text("");
    $("#who").text("");
    name_prov_selected = nombres_provincias.find(obj => obj.id == num_prov_selected)["nm"];

    svg.selectAll("path")
      .data(provincias.features)
      // features es la lista de provincias
      .enter().append("path")
      .attr("d", path)
      .attr("class","map")
      .style("fill", function(d) {
        num_prov= d["properties"]["cod_prov"];
        value = net_provinces.find(obj => obj.id == num_prov)["net_migration"];
        return myColorNet(value);
      }); 

  }
  
}


function update_map(type,num_prov_selected_new,lista_destinos_new,semestre_new){
  $(".map").remove()
  num_prov_selected=num_prov_selected_new
  lista_destinos=lista_destinos_new
  semestre=semestre_new
  domain = get_domain(num_prov_selected,lista_destinos,semestre)
  myColorFlow.domain(domain);
  draw_map(type,num_prov_selected,lista_destinos,semestre)
  $(".leyend").remove()
   if(type=="flujo"){
       draw_leyend(domain)
  }
}


function draw_leyend(domain){
  var range_third = domain
  
  var leyend_data = [{"color":"#e6ffe6","value":range_third[0]},{"color":"#008000","value":range_third[1]}];
  var extent = d3.extent(leyend_data, d => d.value);
 

  var xScale = d3.scaleLinear()
      .range([0, leyend_width])
      .domain(extent);

  var xTicks = domain;

  var xAxis = d3.axisBottom(xScale)
      .tickSize(leyend_height * 2)
      .tickValues(xTicks);
  var position=padding_leyend*17;
  var g = svg.append("g")
    .attr("id","leyend")
    .attr("transform", "translate("+padding_leyend*16+","+position+")")
    .attr("class","leyend");

  var defs = svg.append("defs");
  var linearGradient = defs.append("linearGradient").attr("id", "myGradient");
  linearGradient.selectAll("stop")
    .data(leyend_data)
    .enter().append("stop")
      .attr("offset", d => ((d.value - extent[0]) / (extent[1] - extent[0]) * 100) + "%")
      .attr("stop-color", d => d.color);

  g.append("rect")
      .attr("width", leyend_width)
      .attr("height", leyend_height)
      .style("fill", "url(#myGradient)");

  g.append("g")
    .attr("class", "z axis")
    .call(xAxis)
    .select(".domain").remove();
  return xAxis;
}


function button_listner(){
  const buttons = d3.selectAll('.time_selection');
  buttons.on('change', function() {
    type = this.value
    update_map(type,num_prov_selected,lista_destinos,"total")
  })
}


//Busca en la lista de colores el color correspondiente al código de provincia
function getColorFlow(provincia_destino, provincia_origen,semestre){
    if (provincia_destino == provincia_origen)
      return "#CCC"
      //colorea la provincia seleccionada distinto

    value = getNumEmmigrants(provincia_destino,lista_destinos,semestre)
    return myColorFlow(value)
 }

//Carga la lista de destinos a partir de la provincia de procedencia
function get_destinos(procedencia,data){
  lista_destinos = [];
  for (row in data){
    if (data[row]["Procedencia"]==procedencia){
      lista_destinos.push(data[row])
    }
  }
  return lista_destinos
}

//Devuelve el dato de personas que emigraron a una provincia en particular de una lista de provincias en un semestre
function getNumEmmigrants(provincia_destino,lista_destinos,semestre){
  
  if (semestre=="total"){
    for (i in lista_destinos){
      if (lista_destinos[i]["Destino"]==provincia_destino){
        var temp=0;
        for (s in semestres){
          temp=temp+lista_destinos[i][semestres[s]]
        }
        return temp
      }
    }
  }
  else{
    for (i in lista_destinos){
        if (lista_destinos[i]["Destino"]==provincia_destino)
          return lista_destinos[i][semestre];
    }
  }
  
}

//Devuelve el máximo y mínimo valor de gente que ha emigrado a alguna provincia
function get_domain(procedencia,lista_destinos,semestre){
  var max=-1
  var min = 10000000
  var totales=[]
  for (i in lista_destinos){
    var temp = 0
    if (lista_destinos[i]["Destino"]> 0& lista_destinos[i]["Destino"]!=procedencia){
      for (s in semestres){
        temp=temp+lista_destinos[i][semestres[s]]
        totales.push(temp)
      }
    }
  }
  if (semestre=="total"){
    for (i in totales)
      if (totales[i]>max)
        max=totales[i]
      if (totales[i]<min)
        min=totales[i]
  }
  else{
    for (i in lista_destinos){
      if (lista_destinos[i][semestre]>max&lista_destinos[i]["Destino"]>0)
        max=lista_destinos[i][semestre]
      if (lista_destinos[i][semestre]<min & lista_destinos[i]["Destino"]!=procedencia)
        min=lista_destinos[i][semestre]
    }
  }
  return [min,max]
}

function get_total(lista_destinos,semestre){
  
  if (semestre=="total"){
    for (i in lista_destinos){
      if (lista_destinos[i]["Destino"]==0){
        var temp = 0
        for (s in semestres)
          temp=temp+lista_destinos[i][semestres[s]]
        return temp
      } 
    } 
  }
  else {
    for (i in lista_destinos){
        if (lista_destinos[i]["Destino"]==0)
          return lista_destinos[i][semestre]  
    }
  }
}
  
function resize(){

  viewWidth = $(window).innerWidth();
  viewHeight = $(window).innerHeight();

  width = viewWidth - margin.left - margin.right;
  height = viewHeight - margin.top - margin.bottom;
  padding_leyend = height/20;
  leyend_height = height/100;
  leyend_width = width/3 - (padding_leyend * 2);
  $(".leyend").remove()
  if (type == "flujo")
    draw_leyend(domain)
  scale = height/0.2  ;
  projection.scale(scale);
  svg.attr("width", width)
  .attr("height", height)  
  d3.selectAll("path").attr('d', path);
   
}


