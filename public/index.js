function accountSetup() {
    let x = document.getElementById("setupForm");
    if (x.style.display === "none") {
      x.style.display = "block";
    } else {
      x.style.display = "none";
    }
  }

$(".my-select").chosen({
    width: "50%",
    max_selected_options: 12,
    search_contains: true
});


function myFunction() {
  let x = document.getElementById("myTopnav");
  if (x.className === "topnav") {
    x.className += " responsive";
  } else {
    x.className = "topnav";
  }
}

var playBtns = document.getElementsByClassName('playBtn')
if(playBtns.length != 0) {
  for(let k=0; k<playBtns.length; k++) {
    playBtns[k].addEventListener("click", function() {
      window.open(playBtns[k].getAttribute('href'), '_blank');
    });
  }
}