export let isCodChosen = false;

export const formData = {
    // Backwards-compatible: first person's photo
    personPhoto: { file: '', name: '', file_b64: '' },
    // New: number of people and list of photos
    peopleCount: 1,
    personPhotos: [],
    clothesDescription: '',
    pose: '',
    imgStyle: 'cartoon',
    size: '',
    price: 0,
    // Extras
    packageType: 'basic',
    packagePrice: 0,
    orderSpeed: 'standard',
    orderSpeedPrice: 0,
    paymentType: '',
    currency: '',
    previewPhoto: { file_b64: '', file: '', name: '' },
    // New: multiple previews and selection
    previewPhotos: [],
    selectedPreviewIndex: -1,
    contact: {
        fullName: '',
        email: '',
        phone: '',
        address: '',
        country: 'bg',
        city: '',
        postcode: ''
    },
    affiliate:''
};