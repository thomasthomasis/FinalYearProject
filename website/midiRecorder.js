const slider = document.querySelector(".slider");
const sliderValue = document.querySelector(".value");

slider.addEventListener("input", () => {
  sliderValue.innerHTML = slider.value;
});


const generate = document.querySelector(".generate");
const undo = document.querySelector(".undo");
const clear = document.querySelector(".clear");

generate.addEventListener("click", () => {
  console.log("generating notes");
});

undo.addEventListener("click", () => {
  console.log("undid note");
})

clear.addEventListener("click", () => {
  console.log("cleared notes")
});

const modal = document.querySelector(".modal");
const modalContainer = document.querySelector(".modal-container");
const info = document.querySelector(".info");
const blurCover = document.querySelector(".blur");

info.addEventListener("click", () => {
    modalContainer.style.zIndex = 2;
    modalContainer.style.opacity = 1;
    modal.style.opacity = 1;

    blurCover.style.opacity = 0.6;
    blurCover.style.zIndex = 1;

});

modalContainer.addEventListener("click", () => {
  modalContainer.style.zIndex = -1;
  modalContainer.style.opacity = 0;
  modal.style.opacity = 0;

  blurCover.style.opacity = 0;
  blurCover.style.zIndex = -1;
});