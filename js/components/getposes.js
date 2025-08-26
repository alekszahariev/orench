// getposes.js
import { formData } from '../data.js';
import { hideError } from '../utils/dom.js';

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.querySelector('.pose-scroll');

  try {
    const response = await fetch('https://custom-apis.vercel.app/api/airtable_getposes');
    const data = await response.json();

    data.forEach(item => {
      const name = item.name || 'unknown';
      const imageUrl = item.image || '';

      if (imageUrl) {
        const div = document.createElement('div');
        div.className = 'pose-option';
        div.dataset.pose = name;

        const img = document.createElement('img');
        img.src = imageUrl;
        div.appendChild(img);
        container.appendChild(div);
      }
    });

    // ❗ Must query after items are added to DOM
    const poseOptions = document.querySelectorAll('.pose-option');
    const poseError = document.getElementById('poseError');

    poseOptions.forEach(option => {
      option.addEventListener('click', () => {
        poseOptions.forEach(p => p.classList.remove('selected'));
        option.classList.add('selected');
        formData.pose = option.dataset.pose;
        console.log(formData.pose);
        hideError(poseError);
      });
    });

  } catch (error) {
    console.error('Error loading poses:', error);
  }
});