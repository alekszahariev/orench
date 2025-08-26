document.addEventListener('DOMContentLoaded', function() {
    // Get the URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderid');
    
    // Function to send survey data to webhook
    function sendSurveyData(surveyResponse, action = 'survey_completed', otherText = null) {
        if (!orderId) {
            console.error('No order ID found for survey tracking');
            return;
        }
        
        const data = {
            orderId: orderId,
            action: action,
            surveyResponse: surveyResponse,
            otherText: otherText, // Добавяме полето за custom текст
            timestamp: new Date().toISOString(),
            page: 'thank_you'
        };
        
        fetch(' https://primary-production-f22c.up.railway.app/webhook/b6afd2d3-cabc-454e-b7d2-d17500124819', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Survey data sent successfully:', data);
        })
        .catch(error => {
            console.error('Error sending survey data:', error);
        });
    }
    
    // Listen for survey completion
    window.addEventListener('surveyCompleted', function(event) {
        const surveyResponse = event.detail.surveyResponse;
        const otherText = event.detail.otherText || null;
        
        // Ако е избрано "Друго" и има въведен текст, изпращаме и двете
        if (surveyResponse === 'Other' && otherText) {
            sendSurveyData('Other', 'survey_completed', otherText);
        } else {
            sendSurveyData(surveyResponse, 'survey_completed');
        }
    });
    
    // Listen for survey skipped
    window.addEventListener('surveySkipped', function(event) {
        sendSurveyData('skipped', 'survey_skipped');
    });
});