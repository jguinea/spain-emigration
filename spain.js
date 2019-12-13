var viewWidth = window.innerWidth;
var viewHeight = window.innerHeight;
var test = d3.select("#test");

var margin = {top: 60, right: 20, bottom: 60, left: 40};
var width = viewWidth - margin.left - margin.right;
var height = viewHeight - margin.top - margin.bottom;
var padding_legend = height/20;
var legend_height = height/70;
var legend_width = width/4 - (padding_legend * 2);
var splom_size = height/4
var splom_padding = height/20
d3.select(window).on('resize', resize); //zoom


const semestres = ["2018S2","2018S1","2017S2","2017S1","2016S2","2016S1","2015S2","2015S1","2014S2","2014S1","2013S2","2013S1","2012S2","2012S1","2011S2","2011S1","2010S2","2010S1","2009S2","2009S1","2008S2","2008S1"]
const rural_code=["PU","PR","IN"]
var type = "white"
var selected_provinces = []
var migration_flow = false

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
var ruality = rurality

//Datos para Madrid (estático)
var num_prov_selected = 28;
var lista_destinos = get_destinos(num_prov_selected,data);
var semestre= "total";
domain = get_domain(num_prov_selected,lista_destinos,semestre);

//Escalas de colores
var linColor = d3.scaleLinear()
  .domain(domain)
  .range(["#e6ffe6","#008000"]);
var catColors = d3.scaleOrdinal()
  .domain(rural_code)
  .range(d3.schemeCategory10);

extent_net = d3.extent(net_provinces, d => d.net_migration)
var scaleColor = d3.scaleLinear()
.domain([extent_net[0], 0, extent_net[1]])
.range(["blue", "white", "red"]);

//Dibujarlo todo
draft_map();
button_listner();
draw_splom(type,splom_size,splom_padding)
uncheck();


//MAPS

//Base Map
function draft_map() {
  svg.selectAll("path")
    .data(provincias.features)
    // features es la lista de provincias
    .enter().append("path")
    .attr("d", path)
    .attr("class","map")
    .style("fill", "white");
}


function draw_map(type,prov_sel,lista_destinos,semestre){

  if(type=="urbanizacion"){
    $("#where").text("");
    $("#who").text("");
    
    name_prov_selected = nombres_provincias.find(obj => obj.id == prov_sel)["nm"];
    total = get_total(lista_destinos,semestre)
    svg.selectAll("type")
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
        if (selected_provinces.indexOf(d["properties"]["cod_prov"])==-1){
          return catColors(rural)
        }
        return "white"
      })
      .on("click",function(d){
        num_prov_selected=d["properties"]["cod_prov"]
        update_splom(type,splom_size,splom_padding)
      })
      .on("mouseover",function(d) {
        num_prov_selected = d["properties"]["cod_prov"];
        name_prov_selected = nombres_provincias.find(obj => obj.id == prov_sel)["nm"];
         try {
          var rural=rurality.find(element => element["codigo"]==parseInt(d["properties"]["cod_prov"]))["ruralidad"]
        }
        catch(error) {

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
          if (selected_provinces.indexOf(d["properties"]["cod_prov"])==-1)
            return catColors(rural)
          return "white"
        })
      })
  }

  if(type=="flow"){
    $("#who").text("");
    name_prov_selected = nombres_provincias.find(obj => obj.id == prov_sel)["nm"];
    total = get_total(lista_destinos,semestre)
    $("#where").text("Peña que huye de "+name_prov_selected+": "+total)
    
    svg.selectAll("path")
      .data(provincias.features)
      // features es la lista de provincias
      .enter().append("path")
      .attr("d", path)
      .attr("class","map")
      .style("fill",function(d){
        if (selected_provinces.indexOf(d["properties"]["cod_prov"])==-1)
          return getColorFlow(d["properties"]["cod_prov"],prov_sel,semestre);
        return "white"    
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
          if (selected_provinces.indexOf(d["properties"]["cod_prov"])==-1)
            return getColorFlow(d["properties"]["cod_prov"],prov_sel,semestre);
          return "white"
        })
      })
      .on("click",function(d){
        lista_destinos_new=get_destinos(d["properties"]["cod_prov"],data)
        update_map(type,d["properties"]["cod_prov"],lista_destinos_new,semestre)
        update_splom(type,splom_size,splom_padding)

      })
  }
  
  if(type=="net") {
    $("#where").text("");
    $("#who").text("");
    name_prov_selected = nombres_provincias.find(obj => obj.id == prov_sel)["nm"];

    svg.selectAll("path")
      .data(provincias.features)
      // features es la lista de provincias
      .enter().append("path")
      .attr("d", path)
      .attr("class","map")
      .style("fill", function(d) {
        num_prov= d["properties"]["cod_prov"];
        try {
          value = net_provinces.find(obj => obj.id == num_prov)["net_migration"];
        } catch (error) {
          
        }
        return scaleColor(value);
      })
      .on("mouseover",function(d) {
        try {
          num_prov= d["properties"]["cod_prov"];
          name_province= d["properties"]["name"];
          value = net_provinces.find(obj => obj.id == num_prov)["net_migration"];
        } catch (error) {
          
        }
        d3.select(this)
          .style("fill","#222831")
          $("#who").text("net "+name_province+" = "+value)
      })
      .on("mouseout",function(d){
        d3.select(this)
        .style("fill",function(d){num_prov= d["properties"]["cod_prov"];
        try {
          value = net_provinces.find(obj => obj.id == num_prov)["net_migration"];
        } catch (error) {
          
        }
        if (selected_provinces.indexOf(d["properties"]["cod_prov"])==-1)
          return scaleColor(value);
        return "white"
      })
      })
      .on("click",function(d){
        num_prov_selected=d["properties"]["cod_prov"]
        update_splom(type,splom_size,splom_padding)
      }); 

  }

}


function update_map(type,num_prov_selected_new,lista_destinos_new,semestre_new){
  $(".map").remove()
  num_prov_selected=num_prov_selected_new
  lista_destinos=lista_destinos_new
  semestre=semestre_new
  domain = get_domain(num_prov_selected,lista_destinos,semestre)
  linColor.domain(domain);
  draw_map(type,num_prov_selected,lista_destinos,semestre)
  $(".legend").remove()
  draw_legend(domain,type)
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

function getColorFlow(provincia_destino, provincia_origen,semestre){
  if (provincia_destino == provincia_origen)
    return "#CCC"
    //colorea la provincia seleccionada distinto

  value = getNumEmmigrants(provincia_destino,lista_destinos,semestre)
  return linColor(value)
}

function button_listner(){
  const buttons_map = d3.selectAll('.time_selection');
  buttons_map.on('change', function(d) {
    type = this.value
    update_map(type,num_prov_selected,lista_destinos,"total")
    update_splom(type,splom_size,splom_padding)
  })
  const buttons_splom = d3.selectAll('.splom_selection');
  buttons_splom.on('change', function(d) {
    console.log(typeof this.value)
    if(this.value=="true")
      migration_flow=true
    else
      migration_flow=false
    update_splom(type,splom_size,splom_padding)
  })
}


function selection_listner(sprovinces){
  selected_provinces=sprovinces
}

function draw_legend(domain,type){
  if (type=="flow"){
    var range_third = domain
  
    var legend_data = [{"color":"#e6ffe6","value":range_third[0]},{"color":"#008000","value":range_third[1]}];
    var extent = d3.extent(legend_data, d => d.value);
   
  
    var xScale = d3.scaleLinear()
        .range([0, legend_width])
        .domain(extent);
  
    var xTicks = domain;
  
    var xAxis = d3.axisBottom(xScale)
        .tickSize(legend_height * 2)
        .tickValues(xTicks);
    var position=padding_legend*17;
    var g = svg.append("g")
      .attr("id","legend")
      .attr("transform", "translate("+padding_legend*17+","+position+")")
      .attr("class","legend");
  
    var defs = svg.append("defs");
    var linearGradient = defs.append("linearGradient").attr("id", "myGradient");
    linearGradient.selectAll("stop")
      .data(legend_data)
      .enter().append("stop")
        .attr("offset", d => ((d.value - extent[0]) / (extent[1] - extent[0]) * 100) + "%")
        .attr("stop-color", d => d.color);
  
    g.append("rect")
        .attr("width", legend_width)
        .attr("height", legend_height)
        .style("fill", "url(#myGradient)");
  
    g.append("g")
      .attr("class", "z axis")
      .call(xAxis)
      .select(".domain").remove();
    return xAxis;
  }
  if (type == "urbanizacion"){
    function get_legend_string(code){
      switch(code){
        case "PU":
          return "Urban Area"
        case "PR":
          return "Rural Area"
        case "IN":
          return "Intermediate Area"
      }
    }
    var size=legend_height*3
    var g = svg.append("g")
      .attr("id","legend")
      .attr("class","legend");

    g.selectAll("mydots")
      .data(rural_code)
      .enter()
      .append("rect")
      .attr("x", 100)
      .attr("y", function(d,i){ return 100 + i*(size+5)}) 
      .attr("width", size)
      .attr("height", size)
      .style("fill", function(d){ return catColors(d)})

    g.selectAll("mylabels")
      .data(rural_code)
      .enter()
      .append("text")
      .attr("x", 100 + size*1.2)
      .attr("y", function(d,i){ return 100 + i*(size+5) + (size/2)}) 
      .style("fill", function(d){ return catColors(d)})
      .text(function(d){ return get_legend_string(d)})
      .attr("text-anchor", "left")
      .style("alignment-baseline", "middle");

  }
}


function resize(){

  viewWidth = $(window).innerWidth();
  viewHeight = $(window).innerHeight();
  width = viewWidth - margin.left - margin.right;
  height = viewHeight - margin.top - margin.bottom;
  padding_legend = height/20;
  legend_height = height/70;
  legend_width = width/4 - (padding_legend * 2);
  splom_size = height/4
  splom_padding = height/20
  $(".legend").remove()
  draw_legend(domain,type)
  scale = height/0.2  ;
  projection.scale(scale)
  .translate([width / 3.5, height / 2]);
  svg.attr("width", width)
  .attr("height", height)  
  d3.selectAll("path").attr('d', path);
  update_splom(type,splom_size,splom_padding)

}


function uncheck(){
  var checkboxes = $(".selection");
  console.log(checkboxes.length)
  for (var i=0; i<checkboxes.length; i++)  {
    checkboxes[i].checked = false;
  }
}


function draw_splom(type,size, padding){

  
  var num_str = (num_prov_selected>9) ? parseInt(num_prov_selected) : num_prov_selected


  var columns_budget =["Agrario","Paro","PIB","PresupuestosNorm"]
  var columns_flow =["Agrario","Paro","PIB",num_str]
  columns = (migration_flow) ? columns_flow : columns_budget
  console.log(num_prov_selected,columns)

  var data=splom_data

  var svg = d3.select("body")
              .append("svg")
              .attr("class","splom")
              .attr("width",size*columns.length+padding)
              .attr("height",size*columns.length+padding)
              .append("g")
              .attr("transform","translate("+padding+",0)");

  var xScale = columns.map(c => d3.scaleLinear()
                                  .domain(d3.extent(data,
                                  function(d){
                                      return d[c]
                                  }))
                                  .range([padding/2,size-padding/2]));


                                  
  var yScale = columns.map(c => d3.scaleLinear()
                      .domain(d3.extent(data,d => d[c]))
                      .range([size-padding/2,padding/2]));

                      
  var xAxis = d3.axisBottom()
                  .ticks(6)
                  .tickSize(size*columns.length);

  var x = svg.append("g")
              .selectAll("g")
              .data(xScale)
              .enter()
              .append("g")
              .attr("transform",(d,i) => "translate("+size*i+",0)")
              .each(function(d){
                  return d3.select(this).call(xAxis.scale(d));
              });

  x.select(".domain").remove();
  x.selectAll(".tick line").attr("stroke","#ddd");

  var yAxis = d3.axisLeft()
                  .ticks(6)
                  .tickSize(-size*columns.length);

  var y = svg.append("g")
              .selectAll("g")
              .data(yScale)
              .enter()
              .append("g")
              .attr("transform",(d,i) => "translate(0,"+size*i+")")
              .each(function(d){
                  return d3.select(this).call(yAxis.scale(d));
              });
              
  y.select(".domain").remove();
  y.selectAll(".tick line").attr("stroke","#ddd");


                  
  var cell = svg.append("g")
                  .selectAll("g")
                  .data(d3.cross(d3.range(columns.length),d3.range(columns.length)))
                  .enter()
                  .append("g")
                  .attr("transform",([i,j]) => "translate("+i*size+","+j*size+")");
                  
                  

                  
  cell.append("rect")
      .attr("fill","none")
      .attr("stroke","#aaa")
      .attr("x",padding/2)
      .attr("y",padding/2)
      .attr("width",size-padding)
      .attr("height",size-padding);

      
  cell.each(function([i,j]){
      d3.select(this)
          .selectAll("circle")
          .data(data)
          .enter()
          .append("circle")
          .attr("cx",d => xScale[i](d[columns[i]]))
          .attr("cy",d => yScale[j](d[columns[j]]))
          .attr("r",3.5)
          .attr("fill-opacity",0.7)
          .attr("fill",d => splom_color(type,d));
  });

  var circle = cell.selectAll("circle");


  svg.append("g")
      .style("font","bold 10px sans-serif")
      .selectAll("text")
      .data(columns)
      .enter()
      .append("text")
      .attr("transform",(d,i) => "translate("+i*size+","+i*size+")")
      .attr("x",padding)
      .attr("y",padding)
      .attr("dy",".71em")
      .text(function(d){
        switch(d){
          case "Agrario":
            return "Agriculture workers (%)"
          case "Paro":
            return "Unemployment rate (%)"
          case "PIB":
            return "GDP per capita (€)"
          case "PresupuestosNorm":
            return "Investment p.c. (€)"
        }
        for (province in nombres_provincias){
          if (nombres_provincias[province]["id"]==d)
            return "People leaving "+nombres_provincias[province]["nm"]
        }
      });

      
  var brush = d3.brush()
                  .extent([[padding/2,padding/2],[size-padding/2,size-padding/2]]);

  cell.call(brush);
      
  var brushCell;
  var sprovinces=[]

  brush.on("start",function(){
      selected_provinces = []
      if(brushCell != this){
          d3.select(brushCell).call(brush.move,null);
          brushCell = this;
      }
  });

  brush.on("brush",function([i,j]){
      if(d3.event.selection == null)
          return;
      const [[x0,y0],[x1,y1]] = d3.event.selection;
      circle.attr("fill",function(d){
          if(xScale[i](d[columns[i]])<x0
              || xScale[i](d[columns[i]])>x1
              || yScale[j](d[columns[j]])<y0
              || yScale[j](d[columns[j]])>y1){
                  return "#ccc"
          }
          if(sprovinces.indexOf(d["Codigo"]) === -1){
            sprovinces.push(d["Codigo"])
            selection_listner(sprovinces)
          }
          return splom_color(type,d);
      });
  });


  brush.on("end",function(){
      if(d3.event.selection != null)
          return;
          
      circle.attr("fill",d => splom_color(type,d));
  });

  function splom_color(type,d){
    if (type == "flow"){
      return getColorFlow(d["Codigo"],num_prov_selected,semestre)
    }
    if (type == "net"){
      var value = net_provinces.find(obj => obj.id == d["Codigo"])["net_migration"];
      return scaleColor(value)
    }
    if (type == "urbanizacion")
      return catColors(d.Ruralidad)
    return "white"
  }
}

function update_splom(type, size, padding){
  $(".splom").remove()
  draw_splom(type,size,padding)
}