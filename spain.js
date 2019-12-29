//TODO
//Beautify
    // botones
    // leyenda
//Set rules for select
//Tutorial
//Language Select
//Fix update splom

var viewWidth = window.innerWidth;
var viewHeight = window.innerHeight;

var margin = {top: 60, right: 20, bottom: 60, left: 40};
var width = viewWidth - margin.left - margin.right;
var height = viewHeight - margin.top - margin.bottom;
var mapdiv_width= $("#svg_map").width();
var padding_legend = height/20;
var legend_height = height/70;
var legend_width = width/4 - (padding_legend * 2);
var splom_size = height/4
var splom_padding = height/20;
var padding_output = 0; //150
d3.select(window).on('resize', resize); //zoom



//Esta es la proyeccion sobre la que se coloca la geometría del mapa
var projection = d3.geoConicConformalSpain();
// Añadir la proyección al path
var path = d3.geoPath().projection(projection);

//tamaño de la proyeccion
var scale = height/0.2;
projection.scale(scale)
  .translate([width / 3.3, height / 2]);

var svg = d3.select("#svg_map").append("svg")
  .attr("width", mapdiv_width)
  .attr("height", height);
  //.attr("class","svg_map");

////ADD TEXT LEFT TO THE MAP

/*output = svg.append("g");

output.append("rect").attr("class","output")
  .attr("x","5")
  .attr("y",padding_output)
  .attr("width","275")
  .attr("height","50") */

//Add text below the map

var ag1 = $("#info").width();
var ag2 = $("#info").height();

output = d3.select("#info").append("svg")
  .attr("width",ag1)
  .attr("height",50)
  .append("g");

output.append("rect").attr("class","output")
  .attr("x","0")
  .attr("y",padding_output)
  .attr("width","350")
  .attr("height","50");

output.append("text").attr("class","output")
  .attr("id","where")
  .attr("y",padding_output+18)
  .attr("x","10");

output.append("text").attr("class","output")
  .attr("id","who")
  .attr("y",padding_output+40)
  .attr("x","10");  

//Guardar info de geometría
provincias = geodata



const rural_code=["PU","PR","IN"]
var type = "white"
var flow_splom = false
var flow_splom_column = 0
var selecting = false
var selected_provinces=[]
var selected_id = 28;
var semestre= "total";
var domain = get_domain(selected_id);
var columns =["Agrario","Paro","PIB","PresupuestosNorm"]


//Escalas de colores
var linColor = d3.scaleLinear()
  .domain(domain)
  .range(["#e6ffe6","#008000"]);
var catColors = d3.scaleOrdinal()
  .domain(rural_code)
  .range(d3.schemeCategory10);

extent_net = d3.extent(splom_data, d => d.net)
var scaleColor = d3.scaleLinear()
  .domain([extent_net[0], 0, extent_net[1]])
  .range(["blue", "white", "red"]);

//Dibujarlo todo
draw_map();
button_listner();
draw_splom(splom_size,splom_padding);
uncheck();



//MAPS

function draw_map(){
    svg.selectAll("type")
    .data(provincias.features)
    // features es la lista de provincias
    .enter().append("path")
    .attr("d", path)
    .attr("class","map")
    .style("fill", "white");
  
}


function update_map(){
  var name_prov_selected = splom_data.find(element => element["Codigo"]==selected_id)["Provincia"];
  if (type =="flow") {
    $("#where").text("People from " +name_prov_selected+" moving away: total");///calcular total
  }
  if (type =="net") {
    value = splom_data.find(element => element["Codigo"]==selected_id)["net"];
    $("#where").text("net "+name_prov_selected+" = "+value);
  }
  if (type=="urbanizacion") {
    var rural=splom_data.find(element => element["Codigo"]==selected_id)["Ruralidad"];
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
    $("#where").text(name_prov_selected +" is " + rural_text + ".");
  }
  $("#who").text("");
  domain = get_domain(selected_id)
  linColor.domain(domain);
  svg.selectAll("path")
  .data(provincias.features)
  .on("click",function(d){
    selected_id=d["properties"]["cod_prov"]
    update_map()
    update_splom(splom_size,splom_padding)
    if (type =="flow") {
      var name_prov_selected = splom_data.find(element => element["Codigo"]==selected_id)["Provincia"];
      $("#where").text("People from " +name_prov_selected+" moving away: total");///calcular total
    }
  })
  .on("mouseover",function(d) {
    if (type =="flow"){
      var name_prov_selected = splom_data.find(element => element["Codigo"]==selected_id)["Provincia"];
      var name_destino = d["properties"]["name"]
      var province_id =  d["properties"]["cod_prov"]
      var numEmmigrants = splom_data.find(element => element["Codigo"]==selected_id)[province_id]
      d3.select(this)
        .style("fill","#222831")
        $("#who").text("People from "+name_prov_selected+" to "+name_destino+": "+numEmmigrants)
    }
    if (type=="net"){
      try {
        num_prov= d["properties"]["cod_prov"];
        name_province= d["properties"]["name"];
        value = splom_data.find(element => element["Codigo"]==num_prov)["net"];
      } catch (error) {
        
      }
      d3.select(this)
        .style("fill","#222831")
        $("#where").text("net "+name_province+" = "+value)
    }
    if (type=="urbanizacion"){
      var province_id = d["properties"]["cod_prov"];
        try {
          var rural=splom_data.find(element => element["Codigo"]==province_id)["Ruralidad"]
        }
        catch(error) {
          console.log(error)
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
          var name_hover = splom_data.find(element => element["Codigo"]==province_id)["Provincia"];
        $("#where").text(name_hover +" is " + rural_text + ".");
      
    }
   
  })
  .on("mouseout",function(d){
    if (type == "flow"){
      var name_prov_selected = splom_data.find(element => element["Codigo"]==selected_id)["Provincia"];
      var name_destino = d["properties"]["name"]
      var province_id =  d["properties"]["cod_prov"]
      var numEmmigrants = splom_data.find(element => element["Codigo"]==selected_id)[province_id]
      d3.select(this)
        .style("fill",function(d){
          
          if (province_id==selected_id)
            return "black"
          if (selecting&selected_provinces.indexOf(parseInt(province_id))==-1){

            return "white"

          }
          if (province_id <51){
            return linColor(splom_data.find(element => element["Codigo"]==selected_id)[province_id])
        }
        })
        $("#who").text("People from "+name_prov_selected+" to "+name_destino+": "+numEmmigrants)
    }
    if (type =="urbanizacion"){
      d3.select(this)
        .style("fill",function(d){
          var province_id = d["properties"]["cod_prov"];
          try {
            var rural=splom_data.find(element => element["Codigo"]==province_id)["Ruralidad"]
          }
          catch(error) {
            console.error(d["properties"]["cod_prov"]);
            console.log(error)
          }
          var province_id = d["properties"]["cod_prov"]
          if (selecting&selected_provinces.indexOf(parseInt(province_id))==-1)
            return "white"
          return catColors(rural)

      })
    }
    if (type == "net"){
      d3.select(this)
        .style("fill",function(d){num_prov= d["properties"]["cod_prov"];
        try {
          value = splom_data.find(element => element["Codigo"]==num_prov)["net"];
        } catch (error) {
          
        }
        var province_id = d["properties"]["cod_prov"]
        if (selecting&selected_provinces.indexOf(parseInt(province_id))==-1)
          return "white"
        return scaleColor(value)
    })} 
  })
  .transition()
  .style("fill", function(d){
    var province_id =  d["properties"]["cod_prov"]
    if (type=="urbanizacion"){
      try {
      var rural=splom_data.find(element => element["Codigo"]==province_id)["Ruralidad"]
      }
      catch(error) {
        
      }
      if (selecting&selected_provinces.indexOf(parseInt(province_id))==-1){
        return "white"
      }
      return catColors(rural)
    }
    if(type=="flow"){
      if (province_id==selected_id)
        return "black"
      if (selecting&selected_provinces.indexOf(parseInt(province_id))==-1)
        return "white"
      if (province_id <51){
      return linColor(splom_data.find(element => element["Codigo"]==selected_id)[province_id])
      }
    }
    if (type=="net"){
      try {
        value = splom_data.find(element => element["Codigo"]==province_id)["net"];
      } catch (error) {
      }
      if (selecting&selected_provinces.indexOf(parseInt(province_id))==-1)
        return "white"
      return scaleColor(value)
    }

  });
  $(".legend").remove(); 
  $("#myGradient").remove();
  draw_legend(domain,type)
}



//Devuelve el máximo y mínimo valor de gente que ha emigrado a alguna provincia
function get_domain(procedencia){
  arr = []
  for(i=1;i<51;i++){
    if (i != selected_id)
      arr.push(splom_data.find(element => element["Codigo"]==procedencia)[i])
  }
  return d3.extent(arr)
}

function get_total(selected_id){
  var province = splom_data.find(element => element["Codigo"]==selected_id)
  var total = 0
  for (i=1;i<51;i++){
    total = total+province[i]
  }
  return total
  
}


function button_listner(){
  const buttons_map = d3.selectAll('.time_selection');
  buttons_map.on('change', function(d) {
    
    type = this.value
    update_map()
    update_splom(splom_size,splom_padding)
  })
  const selection_splom = d3.selectAll(".splom_select")
  selection_splom.on('change', function(d){
    for (i =0; i<4; i++){
      var splom_name = "#"+ i+"splom"
      if ($(splom_name).val()=="Flow"){
        flow_splom=true
        flow_splom_column=i
      }

    }
    var column = this.id[0]
    var value = this.value
    columns[column]=value
    update_splom(splom_size,splom_padding)
    
  })
}


function draw_legend(domain,type){
  if (type=="flow") {
    var range_third = domain;
  
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
      .attr("transform", "translate("+padding_legend*17+","+position+")")
      .attr("class","legend");
  
    //var defs = svg.append("defs");
    var linearGradient = svg.append("linearGradient").attr("id", "myGradient");
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
      .attr("y", function(d,i){ return 100 + i*(size+5) + (size/1.2)}) 
      .style("fill", function(d){ return catColors(d)})
      .text(function(d){ return get_legend_string(d)})
      .attr("text-anchor", "left")
      .style("alignment-baseline", "middle")
      .style("font-weight", "bold")
      .style("font-family",'Glegoo-Regular');

  }

  if (type == "net"){
    var range_third = scaleColor.domain();
  
    var legend_data = [{"color":"blue","value":range_third[0]},{"color":"white","value":range_third[1]},{"color":"red","value":range_third[2]}];
    var extent = d3.extent(legend_data, d => d.value);

    var xScale = d3.scaleLinear()
        .range([0, legend_width])
        .domain(extent);
  
    var xTicks = scaleColor.domain();
  
    var xAxis = d3.axisBottom(xScale)
        .tickSize(legend_height * 2)
        .tickValues(xTicks);
    var position=padding_legend*17;
    var g = svg.append("g")
      .attr("transform", "translate("+padding_legend*17+","+position+")")
      .attr("class","legend");
  
    //var defs = svg.append("defs");
    var linearGradient = svg.append("linearGradient").attr("id", "myGradient");
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
  mapdiv_width= $("#svg_map").width();
  $(".legend").remove()
  draw_legend(domain,type)
  scale = height/0.2 ;
  projection.scale(scale)
  .translate([width / 3.3, height / 2]);
  svg.attr("width", mapdiv_width)
  .attr("height", height)  
  d3.selectAll("path").attr('d', path);
  update_splom(splom_size,splom_padding)

}


function uncheck(){
  var checkboxes = $(".selection");
  for (var i=0; i<checkboxes.length; i++)  {
    checkboxes[i].checked = false;
  }

  $("#0splom").val('Agrario');
  $("#1splom").val('Paro');
  $("#2splom").val('PIB');
  $("#3splom").val('PresupuestosNorm');
}


function draw_splom(size, padding){

  
  var province_id =  selected_id

  
  if (flow_splom)
    columns[flow_splom_column] = province_id
  var data=splom_data

  var svg = d3.select("#svg_splom")
              .append("svg")
              .attr("id","splom")
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
                  return d3.select(this).call(xAxis.scale(d))
                  .selectAll("text")
                  .attr("writing-mode","vertical-lr")
                  .attr("text-orientation", "upright")
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
      .text(
        function(d){
        switch(d){
          case "Agrario":
            return "Agriculture workers (%)"
          case "Paro":
            return "Unemployment rate (%)"
          case "PIB":
            return "GDP per capita (€)"
          case "PresupuestosNorm":
            return "Investment p.c. (€)"
          case "PresupuestosTot":
            return "Public spending"
          case "Poblacion":
            return "Population"
          case "net":
            return "Net migration"
          case "netnorm":
            return "Net migration normalized"
          case "Doctores18":
            return "# Doctors"
          case "quiebras":
            return "Banckrupcies"
          case "quiebraspc":
            return "Banckrupcies normalized"
          case "imd":
            return "R&D businesses"
          case "imdnorm":
            return "R&D businesses normalized"
          case "natalidad":
            return "Birthrate"
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

  brush.on("start",function(){
      if(brushCell != this){
          d3.select(brushCell).call(brush.move,null);
          brushCell = this;
      }
  });

  brush.on("brush",function([i,j]){
      sprovinces=[] 
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
            selecting=true
            sprovinces.push(d["Codigo"])
            selected_provinces= sprovinces
            update_map()
          }
          return splom_color(type,d);

      });
  });


  brush.on("end",function(){
      if(d3.event.selection != null)
          return;
      selected_provinces=[] 
      circle.attr("fill",d => splom_color(type,d));
      selecting=false
      update_map()
  });

  function splom_color(type,d){
    if (type == "flow"){
      var value = splom_data.find(obj => obj["Codigo"] == selected_id)[d["Codigo"]];
      return  linColor(value)
    }
    if (type == "net"){
      var value = splom_data.find(obj => obj["Codigo"] == d["Codigo"])["net"];
      return scaleColor(value)
    }
    if (type == "urbanizacion")
      return catColors(d.Ruralidad)
    return "white"
  }
}

function update_splom(size, padding){
  $("#splom").remove();
  draw_splom(size,padding);
}

// To style all selects
$('select').selectpicker();