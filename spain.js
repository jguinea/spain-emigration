//TODO
// Añadir interactividad del tiempo

var viewWidth = window.innerWidth;
var viewHeight = window.innerHeight;

var margin = {top: 60, right: 20, bottom: 60, left: 40};
var width = viewWidth - margin.left - margin.right;
var height = viewHeight - margin.top - margin.bottom;
var padding_leyend = height/20;
var leyend_height = height/100;
var leyend_width = width/3 - (padding_leyend * 2);
var padding = 15;
d3.select(window).on('resize', resize);

const semestres = ["2018S2","2018S1","2017S2","2017S1","2016S2","2016S1","2015S2","2015S1","2014S2","2014S1","2013S2","2013S1","2012S2","2012S1","2011S2","2011S1","2010S2","2010S1","2009S2","2009S1","2008S2","2008S1"]


//Esta es la proyeccion sobre la que se coloca la geometría del mapa
var projection = d3.geoConicConformalSpain()
.translate([width / 2, height / 2])
// Añadir la proyección al path
var path = d3.geoPath()
.projection(projection)

var scale = height /0.2;
projection.scale(scale)
.translate([width / 2, height / 2]);

var svg = d3.select("body").append("svg")
.attr("width", width)
.attr("height", height);

//Guardar info de geometría
provincias = geodata

//JSON importado en el html 
var data = emigration_data

//Datos para Teruel (estático)
var provincia_seleccionada = 44
var destinos=get_destinos(provincia_seleccionada,data)
var semestre="total"
domain = get_domain(provincia_seleccionada,destinos,semestre)
//Escala de colores
var myColor = d3.scaleLinear().domain(domain)
  .range(["yellow","red"])


//Dibujarlo todo
draw_leyend(domain)
draw_map(provincia_seleccionada,destinos,semestre)



//Dibujar el mapa
function draw_map(provincia_seleccionada,destinos,semestre){
  name_seleccion = nombres_provincias.find(obj => obj.id == provincia_seleccionada)["nm"];
  total = get_total(destinos,semestre)
  $(".where").text("Peña que huye de "+name_seleccion+": "+total)
  svg.selectAll("path")
    .data(provincias.features)
    // features es la lista de provincias
    .enter().append("path")
    .attr("d", path)
    .attr("class","map")
    .style("fill",function(d){
      return getColor(d["properties"]["cod_prov"],provincia_seleccionada,semestre);
    })
    .on("mouseover",function(d) {
        name_destino = d["properties"]["name"]
        num = get_semestre(d["properties"]["cod_prov"],destinos,semestre)
        d3.select(this)
        .style("fill","#222831")
        $(".who").text("Peña de "+name_seleccion+" a "+name_destino+": "+num)
      })
      .on("mouseout",function(d){
        d3.select(this)
        .style("fill",function(d){
          return getColor(d["properties"]["cod_prov"],provincia_seleccionada,semestre);
        })
    })
    .on("click",function(d){
      destinos_new=get_destinos(d["properties"]["cod_prov"],data)
      update_map(d["properties"]["cod_prov"],destinos_new,semestre)
    })  
}


function update_map(provincia_seleccionada_new,destinos_new,semestre_new){
  $(".map").remove()
  provincia_seleccionada=provincia_seleccionada_new
  destinos=destinos_new
  semestre=semestre_new
  domain = get_domain(provincia_seleccionada,destinos,semestre)
  myColor = d3.scaleLinear().domain(domain)
  .range(["yellow","red"])
  draw_map(provincia_seleccionada,destinos,semestre)
  $(".leyend").remove()
  draw_leyend(domain)
  

}


function draw_leyend(domain){
  var range_third = domain
  
  var leyend_data = [{"color":"yellow","value":range_third[0]},{"color":"red","value":range_third[1]}];
  var extent = d3.extent(leyend_data, d => d.value);
 

  var xScale = d3.scaleLinear()
      .range([0, leyend_width])
      .domain(extent);

  var xTicks = domain;

  var xAxis = d3.axisBottom(xScale)
      .tickSize(leyend_height * 2)
      .tickValues(xTicks);
  var position=padding_leyend*10
  var g = svg.append("g").attr("transform", "translate(" + padding_leyend + ","+position+")")
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

//Busca en la lista de colores el color correspondiente al código de provincia
function getColor(provincia, provincia_seleccionada,semestre){
    if (provincia == provincia_seleccionada)
      return "#CCC"
      //colorea la provincia seleccionada distinto

    value = get_semestre(provincia,destinos,semestre)
    return myColor(value)
 }

//Carga la lista de destinos a partir de la provincia de procedencia
function get_destinos(procedencia,data){
  destinos = []
  for (row in data){
    if (data[row]["Procedencia"]==procedencia){
      destinos.push(data[row])
    }
  }
  return destinos
}

//Devuelve el dato de personas que emigraron a una provincia en particular de una lista de provincias en un semestre
function get_semestre(destino,destinos,semestre){
  
  if (semestre=="total"){
    for (i in destinos){
      if (destinos[i]["Destino"]==destino){
        var temp=0
        for (s in semestres){
          temp=temp+destinos[i][semestres[s]]
        }
        return temp
      }
    }
  }
  
  for (i in destinos){
      if (destinos[i]["Destino"]==destino)
        return destinos[i][semestre]
  }
  
}

//Devuelve el máximo y mínimo valor de gente que ha emigrado a alguna provincia
function get_domain(procedencia,destinos,semestre){
  var max=-1
  var min = 10000000
  var totales=[]
  for (i in destinos){
    var temp = 0
    if (destinos[i]["Destino"]> 0& destinos[i]["Destino"]!=procedencia){
      for (s in semestres){
        temp=temp+destinos[i][semestres[s]]
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
    for (i in destinos){
      if (destinos[i][semestre]>max&destinos[i]["Destino"]>0)
        max=destinos[i][semestre]
      if (destinos[i][semestre]<min & destinos[i]["Destino"]!=procedencia)
        min=destinos[i][semestre]
    }
  }
  return [min,max]
}
function get_total(destinos,semestre){
  
  if (semestre=="total"){
    for (i in destinos){
      if (destinos[i]["Destino"]==0){
        var temp = 0
        for (s in semestres)
          temp=temp+destinos[i][semestres[s]]
        return temp
      } 
    } 
  }
  
  
  for (i in destinos){
      if (destinos[i]["Destino"]==0)
        return destinos[i][semestre]  
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
  draw_leyend(domain)
  scale = height/0.2  ;
  projection.scale(scale)
  .translate([width / 2, height / 2]);
  svg.attr("width", width)
  .attr("height", height)  
  d3.selectAll("path").attr('d', path);
   
}
/**
 
var data=[1, 2,3,4]
var sliderStep = d3
    .sliderBottom()
    .min(d3.min(data))
    .max(d3.max(data))
    .width(300)
    .tickFormat(d3.format('.2%'))
    .ticks(5)
    .step(0.005)
    .default(0.015)
    .on('onchange', val => {
      d3.select('p#value-step').text(d3.format('.2%')(val));
    });

  var gStep = d3
    .select('div#slider-step')
    .append('svg')
    .attr('width', 500)
    .attr('height', 100)
    .append('g')
    .attr('transform', 'translate(30,30)');

  gStep.call(sliderStep);

  d3.select('p#value-step').text(d3.format('.2%')(sliderStep.value()));



 */