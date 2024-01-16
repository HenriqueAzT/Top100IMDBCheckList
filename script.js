const apiKey = "2123d2e30fee7e3a1d159770055b1ff0";
const apiUrl = "https://api.themoviedb.org/3/movie/top_rated?language=pt-BR";

const options = {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
  },
};

document.addEventListener("DOMContentLoaded", () => {
  const toggleCheckboxesBtn = document.getElementById("toggleCheckboxesBtn");
  toggleCheckboxesBtn.addEventListener("click", toggleCheckboxes);

  fetchMovies();
});

const fetchMovies = async () => {
  let allMovies = [];

  for (let page = 1; page <= 5; page++) {
    const fetchUrl = `${apiUrl}&api_key=${apiKey}&page=${page}`;

    try {
      const response = await fetch(fetchUrl, options);
      const data = await response.json();

      const filteredMovies = data.results.filter((movie) => {
        const releaseYear = new Date(movie.release_date).getFullYear();
        return releaseYear >= 1975;
      });

      const detailedMovies = await Promise.all(
        filteredMovies.map(async (movie) => {
          const detailsUrl = `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${apiKey}&language=pt-BR`;
          const detailsResponse = await fetch(detailsUrl, options);
          const detailsData = await detailsResponse.json();

          return {
            id: movie.id,
            title: movie.title,
            release_date: movie.release_date,
            vote_average: movie.vote_average,
            poster_path: movie.poster_path,
            genres: detailsData.genres,
          };
        })
      );

      allMovies = allMovies.concat(detailedMovies);
    } catch (error) {
      console.error(error);
    }
  }

  displayMovies(allMovies);

  loadLocalData();
};

function displayMovies(movies) {
  const movieListContainer = document.getElementById("movieList");
  movieListContainer.innerHTML = "";

  movies.forEach((movie) => {
    const movieCard = document.createElement("div");
    movieCard.classList.add("movie-card");

    const isChecked = getCheckboxState(movie.id);
    const savedRating = getLocalRating(movie.id);

    const releaseYear = new Date(movie.release_date).getFullYear();

    const genres = movie.genres.map((genre) => genre.name).join(", ");

    movieCard.innerHTML = `
          <div class="checkbox-container">
            <input type="checkbox" id="${movie.id}" ${
      isChecked ? "checked" : ""
    }> 
            <label for="${movie.id}" class="checkbox-custom"></label>
          </div>
          <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${
      movie.title
    } Poster">
          <div>
            <h2>${movie.title} (${releaseYear})</h2>
            <p>Gênero: ${genres}</p>
            <p>Avaliação IMDB: ${movie.vote_average}</p>
            <p>Sua Avaliação: ${savedRating !== null ? savedRating : "N/A"}</p>
            <input type="number" placeholder="Sua Avaliação" id="userRating_${
              movie.id
            }" min="0" max="10" step="0.1">
            <button class="save-rating-btn">Salvar Avaliação</button>
            <button class="clear-rating-btn">Limpar Avaliação</button>
          </div>
        `;

    movieListContainer.appendChild(movieCard);

    const saveButton = movieCard.querySelector(".save-rating-btn");
    const clearButton = movieCard.querySelector(".clear-rating-btn");

    saveButton.addEventListener("click", () => saveUserRating(movie.id));
    clearButton.addEventListener("click", () => clearUserRating(movie.id));

    const checkbox = movieCard.querySelector('input[type="checkbox"]');
    checkbox.addEventListener("change", () => {
      saveCheckboxState(movie.id, checkbox.checked);
      toggleMovieCardHighlight(movieCard, checkbox.checked);
    });

    toggleMovieCardHighlight(movieCard, isChecked);
  });
}

function toggleMovieCardHighlight(movieCard, isChecked) {
  if (isChecked) {
    movieCard.classList.add("checked");
  } else {
    movieCard.classList.remove("checked");
  }
}

function saveUserRating(movieId) {
  const userRatingInput = document.getElementById(`userRating_${movieId}`);
  const userRating = userRatingInput.value;

  if (
    /^\d+(\.\d+)?$/.test(userRating) &&
    parseFloat(userRating) >= 0 &&
    parseFloat(userRating) <= 10
  ) {
    saveLocalRating(movieId, parseFloat(userRating));
    saveCheckboxState(movieId, true);
    location.reload();
  } else {
    alert("Por favor, insira uma avaliação válida entre 0 e 10.");
  }
}

function clearUserRating(movieId) {
  localStorage.removeItem(`movie_${movieId}_rating`);
  saveCheckboxState(movieId, false);
  location.reload();
}

function updateRatingElement(parentElement, rating) {
  const userRatingElement = parentElement.querySelector("p:last-child");
  userRatingElement.textContent = `Sua Avaliação: ${
    rating !== null ? rating : "N/A"
  }`;
}

function toggleCheckboxes() {
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach((checkbox) => {
    checkbox.checked = !checkbox.checked;
    saveCheckboxState(checkbox.id, checkbox.checked);
  });
}

document.addEventListener("DOMContentLoaded", () => {
    const toggleCheckboxesBtn = document.getElementById("toggleCheckboxesBtn");
    toggleCheckboxesBtn.addEventListener("click", toggleCheckboxes);

    const scrollPositionBeforeReload = localStorage.getItem('scrollPosition');

    if (scrollPositionBeforeReload !== null) {
      window.scrollTo(0, parseInt(scrollPositionBeforeReload));
    }
  
    fetchMovies();
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", () =>
        saveCheckboxState(checkbox.id, checkbox.checked)
      );
    });

    window.addEventListener('beforeunload', () => {
      localStorage.setItem('scrollPosition', window.scrollY);
    });
  });  
  
function saveCheckboxState(movieId, isChecked) {
  localStorage.setItem(
    `movie_${movieId}_checked`,
    isChecked ? "true" : "false"
  );
}

function getCheckboxState(movieId) {
  const storedValue = localStorage.getItem(`movie_${movieId}_checked`);
  return storedValue === "true";
}

function saveLocalRating(movieId, rating) {
  localStorage.setItem(`movie_${movieId}_rating`, rating);
}

function getLocalRating(movieId) {
  const storedValue = localStorage.getItem(`movie_${movieId}_rating`);
  return storedValue !== null ? parseFloat(storedValue) : null;
}
