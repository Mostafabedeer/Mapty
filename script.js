'use strict';

const sideBar = document.querySelector('.sidebar');
const btnSideBarClose = document.querySelector('.sidebar__close');
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const btnRemove = document.querySelector('.control__clear');
const btnShow = document.querySelector('.control__show');
const btnSort = document.querySelector('.control__sort');
const modal = document.querySelector('.modal');
const overlay = document.querySelector('.overlay');
const btnSubmitDelete = document.querySelector('.modal__controls--submit');
const btnignoreDelete = document.querySelector('.modal__controls--ignore');
const btnMap = document.querySelector('.map__icon');

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  click = 0;

  constructor(coords, distance, duration) {
    // this.date = ..
    // this.id = ..
    this.coords = coords; // [lat, lng]
    this.distance = distance; // Km
    this.duration = duration; // Min
  }

  _setDiscription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.discription = `${
      this.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
    } ${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
  clicks() {
    this.click++;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDiscription();
  }

  calcPace() {
    // Min/ Km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.clacSpeed();
    this._setDiscription();
  }

  clacSpeed() {
    // Km/ h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

// const run1 = new Running([30, 31], 20, 100, 40);
// const cycling1 = new Cycling([30, 31], 20, 100, 40);
// console.log(run1, cycling1);

//////////////////////////////////////////
// Application Architecture
class App {
  #workouts = [];
  #markers = [];
  #map;
  #mapEvent;
  #currentWorkout;

  constructor() {
    // Get the location
    this._getPosition();
    // Get the data from local storage
    this._getFromLocalStorage();
    // Attach Events Handlers
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener(
      'click',
      this._triggerWorkout.bind(this)
    );
    btnRemove.addEventListener('click', this._removeAll.bind(this));
    btnShow.addEventListener('click', this._showAllMarkers.bind(this));
    btnSort.addEventListener('click', this._sortWorkouts.bind(this));
    btnSubmitDelete.addEventListener('click', this._submitDeleteAll.bind(this));
    btnignoreDelete.addEventListener('click', this._toggleModal);
    overlay.addEventListener('click', this._toggleModal);
    btnSideBarClose.addEventListener('click', this._triggerSideBar.bind(this));
    btnMap.addEventListener('click', this._triggerSideBar.bind(this));
  }

  _getPosition() {
    navigator.geolocation.getCurrentPosition(
      this._loadMap.bind(this),
      function () {
        {
          alert('could not find your position');
        }
      }
    );
  }

  _loadMap(position) {
    const { latitude, longitude } = position.coords;

    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, 14);

    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Handling the click on map
    this.#map.on('click', this._showForm.bind(this));

    // Set markers on the map
    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;

    // Display a form
    inputType.disabled = false;
    form.classList.remove('hidden');
    inputDistance.focus();

    // check if sidebar is closed
    if (sideBar.classList.contains('open')) return;
    this._triggerSideBar();
  }

  _hideForm() {
    // Clear inputs
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';

    // Hide form
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => {
      form.style.display = 'grid';
    }, 1000);
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();
    let workout, latW, lngW;
    // Helper functions
    const vaildInputs = (...inputs) =>
      inputs.every(input => Number.isFinite(input));
    const positiveInputs = (...inputs) => inputs.every(input => input > 0);

    // check if there is event occurs or just the user edit

    if (this.#mapEvent) {
      const { lat, lng } = this.#mapEvent.latlng;
      latW = lat;
      lngW = lng;

      // Get data from form
      const type = inputType.value;
      const distance = +inputDistance.value;
      const duration = +inputDuration.value;

      // If the type is running create running object
      if (type === 'running') {
        const cadence = +inputCadence.value;
        // Check if the data is vaild ( positive numbers )
        if (
          !vaildInputs(distance, duration, cadence) ||
          !positiveInputs(distance, duration, cadence)
        )
          return alert('Please add positive numbers!');
        workout = new Running([latW, lngW], distance, duration, cadence);
      }

      // If the type is cycling create cycling object
      if (type === 'cycling') {
        const elevation = +inputElevation.value;
        // Check if the data is vaild ( positive numbers )
        if (
          !vaildInputs(distance, duration) ||
          !positiveInputs(distance, duration)
        )
          return alert('Please add positive numbers!');
        workout = new Cycling([latW, lngW], distance, duration, elevation);
      }

      // Add new workout to array
      this.#workouts.push(workout);
      console.log(this.#workouts);

      // Render workout on a map as marker
      this._renderWorkoutMarker(workout);

      // Render Workout in a list
      this._renderWorkout(workout);

      // Hide the form + clear inputs
      this._hideForm();

      // Set to local storage
      this._setToLocalStorage();
    } else {
      this.#currentWorkout.type = inputType.value;
      this.#currentWorkout.distance = +inputDistance.value;
      this.#currentWorkout.duration = +inputDuration.value;

      if (this.#currentWorkout.type === 'running')
        this.#currentWorkout.cadence = +inputCadence.value;

      if (this.#currentWorkout.type === 'cycling')
        this.#currentWorkout.elevationGain = +inputElevation.value;

      // Render the edited workout
      this._renderWorkout(this.#currentWorkout);

      // Add the edited workout to workouts array
      this.#workouts.push(this.#currentWorkout);

      // Set to local
      this._setToLocalStorage();

      // close form
      this._hideForm();
    }
  }

  _renderWorkoutMarker(workout) {
    const marker = new L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          closeOnClick: false,
          autoClose: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(`${workout.discription} `)
      .openPopup();

    this.#markers.push(marker);
  }

  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
      <a href="#" class="workout__clear">
        <ion-icon name="trash-outline"></ion-icon>
      </a>
      <a href="#" class="workout__edit">
      <ion-icon name="create-outline"></ion-icon>
      </a>

      <h2 class="workout__title">${workout.discription}</h2>
      <div class="workout__details">
        <span class="workout__icon">${
          workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
        }</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>
    `;
    if (workout.type === 'running') {
      html += `
        <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
        </div>
      </li>
      `;
    }

    if (workout.type === 'cycling') {
      html += `
         <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>
      `;
    }
    form.insertAdjacentHTML('afterend', html);
  }

  _triggerWorkout(e) {
    const workoutEl = e.target.closest('.workout');
    if (!workoutEl) return;
    const workout = this.#workouts.find(
      workout => workout.id === workoutEl.dataset.id
    );

    // console.log(this.#currentWorkout);

    if (e.target.name === 'trash-outline') {
      // Remove the workout from the DOM
      workoutEl.remove();

      // Remove the workout from the array
      const index = this.#workouts.indexOf(workout);
      this.#workouts.splice(index, 1);

      // Set to local the current workouts
      this._setToLocalStorage();

      // Remove the workout marker
      this._removeMarker(workout);
    }

    // Edit the workout
    else if (e.target.name === 'create-outline') {
      this.#currentWorkout = workout;
      this.#mapEvent = undefined;

      // Add workout data to the form
      if (inputType.value !== workout.type) this._toggleElevationField();
      inputType.value = workout.type;
      inputDistance.value = workout.distance;
      inputDuration.value = workout.duration;
      if (workout.type === 'running') inputCadence.value = workout.cadence;

      if (workout.type === 'cycling')
        inputElevation.value = workout.elevationGain;

      // Display a form
      inputType.disabled = true;
      form.classList.remove('hidden');
      inputDistance.focus();

      // Remove the workout marker
      // this._removeMarker(workout);

      // Remove the current workout from the list
      workoutEl.remove();

      // Remove the workout from the array
      const index = this.#workouts.indexOf(workout);
      this.#workouts.splice(index, 1);
    } else {
      // BUGFIX: When we click on a workout before the map has loaded, we get an error. But there is an easy fix:
      if (!this.#map) return;
      // Close the side
      this._triggerSideBar();
      // Fly to the workout marker
      this.#map.flyTo(workout.coords, 15, {
        animate: true,
        pan: {
          duration: 1,
        },
      });
    }

    // Using public interface
    // workout.clicks();
  }

  _setToLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getFromLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return;

    this.#workouts = data;
    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }

  _toggleModal() {
    modal.classList.toggle('hidden');
    overlay.classList.toggle('hidden');
  }
  _triggerSideBar() {
    sideBar.classList.toggle('open');
    this._showMapIcon();
  }

  _showMapIcon() {
    btnMap.classList.toggle('show');
  }
  _removeAll() {
    // Open Modal
    this._toggleModal();
  }
  _submitDeleteAll() {
    // Remove from local
    localStorage.removeItem('workouts');

    // Remove workouts from dom
    const workouts = containerWorkouts.querySelectorAll('.workout');
    workouts.forEach(work => work.remove());

    // Remove workouts markers
    for (const marker of this.#markers) {
      this.#map.removeLayer(marker);
    }
    // clear the workouts
    this.#workouts = [];

    // Hide the modal
    this._toggleModal();
  }

  _removeMarker(workout) {
    const marker = this.#markers.find(marker => {
      const { lat } = marker._latlng;
      return lat === workout.coords[0];
    });
    this.#map.removeLayer(marker);
  }

  _showAllMarkers(e) {
    this._triggerSideBar();
    const group = new L.featureGroup(this.#markers);

    this.#map.fitBounds(group.getBounds());
  }

  _sortWorkouts() {
    // containerWorkouts.innerHTML = '';
    const lis = containerWorkouts.querySelectorAll('.workout');
    lis.forEach(li => li.remove());

    // Sorting the array based on the "distance" property

    this.#workouts.sort((a, b) => a.distance - b.distance);

    this.#workouts.forEach(workout => {
      this._renderWorkout(workout);
    });
  }
  _reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
