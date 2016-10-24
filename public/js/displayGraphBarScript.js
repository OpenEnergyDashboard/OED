// set the dimensions and margins of the graph
var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

// set the ranges
var x1 = d3.scaleBand()
          .range([0, width])
          .padding(0.1);

var y1 = d3.scaleLinear()
          .range([height, 0]);
          
// append the svg object to the #displayGraphBar of the page
// append a 'group' element to 'svg'
// moves the 'group' element to the top left margin
var svg1 = d3.select("#displayGraphBar").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", 
          "translate(" + margin.left + "," + margin.top + ")");

// get the data
d3.csv("data/data-bar.csv", function(error, data) {
  if (error) throw error;

  // format the data
  data.forEach(function(d) {
    d.power = +d.power;
  });

  // Scale the range of the data in the domains
  x1.domain(data.map(function(d) { return d.building; }));
  y1.domain([0, d3.max(data, function(d) { return d.power; })]);

  // append the rectangles for the bar chart
  svg1.selectAll(".bar")
      .data(data)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d) { return x1(d.building); })
      .attr("width", x1.bandwidth())
      .attr("y", function(d) { return y1(d.power); })
      .attr("height", function(d) { return height - y1(d.power); });

  // add the x Axis
  svg1.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x1));

  // add the y Axis
  svg1.append("g")
      .call(d3.axisLeft(y1))
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", "0.71em")
      .attr("fill", "#000")
      .text("kWh");
});