const formatToProperCase = (str) => {
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();}).replace(/-/g, ' ');
}

export { formatToProperCase };