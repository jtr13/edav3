// ############ SETUP ###############

function setup() {

  d3.select("div#buttons")
    .append("input")
    .attr("type", "button")
    .attr("value", "Done adding points")
    .attr("onclick", "choosek()");

  svg = d3.select("div#plot")
    .append("svg")
    .attr("width", w)
    .attr("height", h);

// create plot area
  svg.append("g")
    .attr("id", "plotarea")
    .attr("transform", `translate( ${margin.left}, ${margin.top} )`)

// create x-axis
  svg.select("g#plotarea")
    .append("g")
    .attr("id", "xaxis")
    .attr("transform", `translate (0, ${innerHeight})`)
    .call(xAxis);

// create x-axis label
  svg.select("g#plotarea")
    .append("text")
    .attr("id", "xlab")
    .attr("x", innerWidth/2)
    .attr("y", innerHeight + .75 * margin.bottom)
    .attr("text-anchor", "middle")
    .text("v1");

// create y-axis
  svg.select("g#plotarea")
    .append("g")
    .attr("id", "yaxis")
    .call(yAxis);

// create y-axis label
  svg.select("g#plotarea")
    .append("text")
    .attr("id", "ylab")
    .attr("x", -margin.left/2)
    .attr("y", innerHeight/2)
    .attr("text-anchor", "middle")
    .attr("transform", "rotate (-90, " + (0 - .75 * margin.left) + "," + innerHeight/2 + ")" )
    .text("v2");


// create data

// https://stackoverflow.com/questions/18273884/live-drawing-of-a-line-in-d3-js

svg.on("mousedown", mousedown)
  .on("mouseup", mouseup);

function mousedown() {
    const new_x = xScale.invert(d3.pointer(event)[0] - `${margin.left}`);
	  const new_y = yScale.invert(d3.pointer(event)[1] - `${margin.top}`);
    svg.select("#plotarea")
      .append("circle")
        .data([{x: new_x, y: new_y}])
        .attr("cx", d => xScale(d.x))
        .attr("cy", d => yScale(d.y))
        .attr("r", "3");

    svg.on("mousemove", mousemove);
}

function mousemove() {
    const new_x = xScale.invert(d3.pointer(event)[0] - `${margin.left}`);
	  const new_y = yScale.invert(d3.pointer(event)[1] - `${margin.top}`);
    svg.select("#plotarea")
      .append("circle")
        .data([{x: new_x, y: new_y}])
        .attr("cx", d => xScale(d.x))
        .attr("cy", d => yScale(d.y))
        .attr("r", "3");
}

function mouseup() {
    svg.on("mousemove", null);
}


}

// ############ CHOOSEK ###############


function choosek() {
  action = "done";

  d3.select("h3#info").text("Choose the number of clusters")

  d3.select("div#buttons").select("input").remove();

  const kvalues = d3.range(11);

  d3.select("div#buttons")
    .append("select")
      .attr("name", "numclusters")
      .attr("id", "k")
      .on("change", function() {
        const k = d3.select(this).property("value");
        d3.select("svg").datum(k);
        kmeansbegin();
      })
    .append("option")
      .attr("value", "select")
      .text("Choose k");

  d3.select("div#buttons").select("select#k")
    .selectAll("option")
    .data(kvalues)
    .enter()
    .append("option")
      .attr("value", d => d)
      .text(d => d);
}

// ############ KMEANSBEGIN ###############

function kmeansbegin() {

  d3.select("div#buttons").select("select").remove();

  d3.select("div#buttons").append("input")
    .attr("value", "Add centroids")
    .attr("type", "button")
    .attr("onclick", "update_centroids()");

  const allpoints = svg.selectAll("circle")
  data = allpoints.data();

  const k = d3.select("svg").datum();

  data = data.map(d => ({x: d.x, y: d.y, cluster: d3.randomInt(k)()}));

  allpoints.data(data);

  allpoints
    .style("fill", d => colorScale(d.cluster));

    // draw initial centroids

  let centroids = d3.range(k).map(e =>
    ({x: d3.mean(data.filter(d => d.cluster == e).map(d => d.x)),
      y: d3.mean(data.filter(d => d.cluster == e).map(d => d.y)),
      cluster: e}));

  svg.select("g#plotarea")
    .append("g")
      .attr("id", "centroids")
      .selectAll("circle")
      .data(centroids)
      .enter()
      .append("circle")
        .attr("cx", d => xScale(d.x))
        .attr("cy", d => yScale(d.y))
        .attr("r", "0")
        .style("fill", d => colorScale(d.cluster));
}


// ############ UPDATE_CENTROIDS ###############

function update_centroids() {

  d3.select("h3#info").text("Click button to reassign points to the nearest centroid.")

  const k = d3.select("svg").datum();

  const oldcentroids = svg
    .select("#centroids")
    .selectAll("circle")
	  .data()

  const centroids = d3.range(k).map(e =>
    ({x: d3.mean(data.filter(d => d.cluster == e).map(d => d.x)),
      y: d3.mean(data.filter(d => d.cluster == e).map(d => d.y)),
      cluster: e}));

  let done = false;

  for(let i = 0; i < centroids.length; i++) {}



// update centroids
  svg.select("#centroids").selectAll("circle")
	  .data(centroids)
		  .transition()
		  .duration(1000)
		  .attr("r", "6")
			.attr("cx", d => xScale(d.x))
			.attr("cy", d => yScale(d.y));

  d3.select("div#buttons").select("input")
    .attr("value", "Reassign points")
    .attr("onclick", "reassign_points()");

}

// source: https://www.naftaliharris.com/blog/visualizing-k-means-clustering/

function dist(w, z) {
    return Math.sqrt(Math.pow(w.x - z.x, 2) + Math.pow(w.y - z.y, 2));
}


// ############ REASSIGN_POINTS ###############

// source: https://www.naftaliharris.com/blog/visualizing-k-means-clustering/
function reassign_points() {

  d3.select("h3#info").text("Click button to recalcuate centroids based on new points.")

  const centroids = d3.select("#centroids")
    .selectAll("circle").data();

  for(let j = 0; j < data.length; j++){
    let ibest = 0;
    let dbest = Infinity;
    for(let i = 0; i < centroids.length; i++) {
        const d = dist(data[j], centroids[i]);
        if(d < dbest) {
          dbest = d;
          ibest = i;
        }
    }
    data[j].cluster = ibest;
  }

    svg.selectAll("circle")
		  .data(data)
			.style("fill", d => colorScale(d.cluster))

	 d3.select("div#buttons").select("input")
     .attr("value", "Update centroids")
     .attr("onclick", "update_centroids()");


};

