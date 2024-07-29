import Sortable from './node_modules/sortablejs/modular/sortable.complete.esm.js';
import { GoogleGenerativeAI } from "@google/generative-ai";
const API_KEY = 'AIzaSyCm6EZCxuOKLnO_2WBwED9n9qMwA8qRr1Y';
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});

let inputTareas = document.getElementById('inputTareas');
let inputAI = document.getElementById('inputAI');
let listaTareas = document.getElementById('listaTareas');
let UINotice = document.getElementById('userInputNotice');
let UINoticeAI = document.getElementById('userInputNoticeAI');
let sfxAdd = new Audio("https://github.com/rd-varela/tp-js-final/blob/main/sfx/Add.mp3?raw=true");
let sfxDel = new Audio("https://github.com/rd-varela/tp-js-final/blob/main/sfx/Substract.mp3?raw=true")
let sfxComp = new Audio("https://github.com/rd-varela/tp-js-final/blob/main/sfx/Tick.mp3?raw=true")
let sfxClear = new Audio("https://github.com/rd-varela/tp-js-final/blob/main/sfx/Clear.mp3?raw=true")
let isMuted = false;


let sortable = new Sortable(listaTareas, {
	animation: 350,
    easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    swapThreshold: 1,
    onEnd: function(evt) {
        guardarTareas();
    },
});

if (localStorage.getItem('isMuted')) {
    isMuted = localStorage.getItem('isMuted') === 'true';
    updateMuteButton();
}

document.getElementById('muteBtn').addEventListener('click', function() {
    isMuted = !isMuted;
    updateMuteButton();
    

    localStorage.setItem('isMuted', isMuted);
});

function updateMuteButton() {
    const muteBtn = document.getElementById('muteBtn');
    if (isMuted) {
        muteBtn.classList.add('muted');
    } else {
        muteBtn.classList.remove('muted');
    }
}

function playSound(audio) {
    if (!isMuted) {
        audio.play();
    }
}

cargarTareas();

inputTareas.addEventListener('input', function() {
    let textLength = inputTareas.value.length;
    if (textLength >= 3 && textLength <= 50) {
        UINotice.style.opacity = 1
        UINotice.classList.remove('error');
        UINotice.textContent = `${textLength}`;
    } else if (textLength > 50) {
        UINotice.style.opacity = 1
        UINotice.classList.add('error');
        UINotice.textContent = `${textLength}`;
    }
    else {
        UINotice.textContent = '';
        UINotice.classList.remove('error');
    }
});

function agregarTarea() {
    let textoTareas = inputTareas.value.trim();
    UINotice.classList.remove('error');
    try {
        if (textoTareas === '') {
            throw new Error('la tarea no puede estar vacía!');
        }

        if (textoTareas.length > 50) {
            throw new Error('maximo 50 caracteres!');
        }

        let li = document.createElement('li');
        li.classList.add('animate');
        li.textContent = textoTareas;
        listaTareas.appendChild(li);
        inputTareas.value = '';
        playSound(sfxAdd);

        li.addEventListener('click', completarTarea);
        let deleteBtn = document.createElement('button');
        deleteBtn.textContent = '-';
        deleteBtn.addEventListener('click', borrarTarea);
        li.appendChild(deleteBtn);

        UINotice.textContent = 'agregado!';
        UINotice.style.opacity = 1;
        fadeOutNotice();
        li.addEventListener('animationend', () => {
            li.classList.remove('animate');
        });

        guardarTareas();
    } catch (error) {
        UINotice.classList.add('error');
        UINotice.textContent = error.message;
        UINotice.style.opacity = 1;
        fadeOutNotice();
    }
}

function fadeOutNotice() {
    setTimeout(function() {
        UINotice.style.opacity = 0;
    }, 2500);
}

inputTareas.addEventListener("keydown", function(event) {
    if (event.keyCode === 13) {
      agregarTarea();
    }
  });


window.agregarTarea = agregarTarea

async function agregarTareaAI(){
    listaTareas.innerHTML = '';
    localStorage.removeItem('tareas');
    let textoInputAI = inputAI.value.trim();
    const prompt = "return in a json valid array format a to-do list for" + textoInputAI + " in the same language as exposed, only the array so that I can fetch the response into json, it should include only the task with the object name tarea followed by what to do, maximum characters per tarea are 50. if the prompt is nonsensical, return the prompt"
    
    UINoticeAI.style.opacity = 1;
    UINoticeAI.classList.remove('error');
    UINoticeAI.textContent = 'pensando...';
    fadeOutNoticeAI()
    playSound(sfxAdd);

    try {

        if (textoInputAI === '') {
            throw new Error;
        }

        const result = await model.generateContent(prompt);
        const responseTextDirty = result.response.candidates[0].content.parts[0].text;
        const cleanedResponse = responseTextDirty
        .replace(/^[^{\[]+/, '')
        .replace(/[^}\]]+$/, '');
        const responseArray = JSON.parse(cleanedResponse);
        responseArray.forEach((obj, index) => {
            setTimeout(() => {
                let li = document.createElement('li');
                li.textContent = obj.tarea;
                li.classList.add('animate');
                listaTareas.appendChild(li);
                li.addEventListener('click', completarTarea);
                let deleteBtn = document.createElement('button');
                deleteBtn.textContent = '-';
                deleteBtn.addEventListener('click', borrarTarea);
                li.appendChild(deleteBtn);
                inputAI.value = '';

                li.addEventListener('animationend', () => {
                    li.classList.remove('animate');
                });
            }, index * 300);
        });

        UINoticeAI.style.opacity = 1;
        UINoticeAI.textContent = '(esto borrara todas las tareas ingresadas)';
        guardarTareas();
    } catch (error) {
        UINoticeAI.style.opacity = 1;
        UINoticeAI.classList.add('error');
        UINoticeAI.textContent = 'ocurrio un error, intenta nuevamente';
    }
}

window.agregarTareaAI = agregarTareaAI

function fadeOutNoticeAI() {
    setTimeout(function() {
        UINoticeAI.style.opacity = 0;
    }, 1000);
}

inputAI.addEventListener("keydown", function(event) {
    if (event.keyCode === 13) {
      agregarTareaAI();
    }
  });

function completarTarea(event) {
    let tarea = event.target;
    tarea.classList.toggle('completado')
    playSound(sfxComp);
    guardarTareas();
}

function borrarTarea(event){
    let tarea = event.target.parentElement;
    listaTareas.removeChild(tarea);
    playSound(sfxDel);
    guardarTareas();
}

clearButton.addEventListener('click', function() {
    listaTareas.innerHTML = '';
    playSound(sfxClear);
    localStorage.removeItem('tareas');
    UINotice.textContent = '';
    inputTareas.value = '';
});

function guardarTareas(){
    const tareas = [];
    const itemsTareas = listaTareas.getElementsByTagName('li');

    for (let i = 0; i < itemsTareas.length; i++){
        let tareaTexto = itemsTareas[i].textContent.replace('-', '').trim();
        let tareaCompletada = itemsTareas[i].classList.contains('completado');
        tareas.push({ texto: tareaTexto, completada: tareaCompletada });
    }

    localStorage.setItem('tareas', JSON.stringify(tareas));
    console.log(tareas)
    console.log(itemsTareas)
}

function cargarTareas(){
    const tareas = JSON.parse(localStorage.getItem('tareas'));
    if (tareas) {
            listaTareas.innerHTML = '';
            tareas.forEach(tarea => {
            let li = document.createElement('li');
            li.textContent = tarea.texto;
            if (tarea.completada) {
                li.classList.add('completado');
            }
            listaTareas.appendChild(li);
            li.addEventListener('click', completarTarea);

            let deleteBtn = document.createElement('button');
            deleteBtn.textContent = '-';
            deleteBtn.addEventListener('click', borrarTarea)
            li.appendChild(deleteBtn);

            guardarTareas();
            });
        }
}

document.addEventListener('DOMContentLoaded', function () {
    const darkMode = document.getElementById('darkMode');
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    
    setDarkMode(isDarkMode);

    darkMode.addEventListener('click', function () {
        const darkModeEnabled = document.body.classList.toggle('darkMode');
        localStorage.setItem('darkMode', darkModeEnabled);
    });

    function setDarkMode(enableDarkMode) {
        if (enableDarkMode) {
            document.body.classList.add('darkMode');
        } else {
            document.body.classList.remove('darkMode');
        }
    }
});