import { getDatabase, ref, set, get, child } from "https://www.gstatic.com/firebasejs/9.1.1/firebase-database.js";
const db = getDatabase();

document.getElementById("send").addEventListener("click", sendData);
function sendData(){
    
    let textFieldData = document.getElementById("textField").value;

    set(ref(db, '/data/users/'), {
        username: textFieldData
      });

    
}
/* ------- geting data --------- */

const dbRef = ref(getDatabase());
get(child(dbRef, "text")).then((snapshot) => {
  if (snapshot.exists()) {
    document.getElementById("heading").innerHTML = snapshot.val();
  }else {
    console.log("No data available");
  }
}).catch((error) => {
  console.error(error);
});
