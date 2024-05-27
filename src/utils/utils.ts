export function isNumber(str: string) {
    return /^[0-9]+$/.test(str);
}

export function numberWithDot(num: string | number) {
    return num.toString().replace('.', '').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function startCase(str: string) {
    // Define Vietnamese characters
    const vietnameseChars = "ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝàáâãèéêìíòóôõùúýĂăĐđĨĩŨũƠơƯưẠạẢảẤấẦầẨẩẪẫẬậẮắẰằẲẳẴẵẶặẸẹẺẻẼẽẾếỀềỂểỄễỆệỈỉỊịỌọỎỏỐốỒồỔổỖỗỘộỚớỜờỞởỠỡỢợỤụỦủỨứỪừỬửỮữỰựỲỳỴỵỶỷỸỹ";

    // Split the string into words
    const words = str.split(/\s+/);

    // Capitalize the first letter of each word
    const capitalizedWords = words.map(word => {
        // Check if the first character of the word is a Vietnamese character
        if (vietnameseChars.includes(word.charAt(0))) {
            // If yes, capitalize the first character using the uppercase Vietnamese character
            return word.charAt(0).toUpperCase() + word.slice(1);
        } else {
            // If not, capitalize the first character using regular rules
            return word.charAt(0).toUpperCase() + word.slice(1);
        }
    });

    // Join the words back into a string
    return capitalizedWords.join(' ');
}




