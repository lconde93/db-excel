module.exports = function (text, arg) {
    if (!text) return '';

    const date = text instanceof Date ? text : new Date(text);
    const format = arg;
    let result = format;

    const attrs = {
        year: { regex: /YYYY/, value: date.getFullYear() },
        month: { regex: /(MM)/, value: (date.getMonth() + 1) > 9 ? (date.getMonth() + 1) : '0' + (date.getMonth() + 1) },
        monthSingle: { regex: /M/, value: (date.getMonth() + 1) },
        day: { regex: /DD/, value: date.getDate() > 9 ? date.getDate() : '0' + date.getDate() },
        daySingle: { regex: /D/, value: date.getDate() },
        hours: { regex: /(HH)/, value: date.getHours() > 9 ? date.getHours() : '0' + date.getHours() },
        hoursSingle: { regex: /H/, value: date.getHours() },
        minutes: { regex: /mm/, value: date.getMinutes() > 9 ? date.getMinutes() : '0' + date.getMinutes() },
        minutesSingle: { regex: /m/, value: date.getMinutes() },
        seconds: { regex: /(ss)/, value: date.getSeconds() > 9 ? date.getSeconds() : '0' + date.getSeconds() },
        secondsSingle: { regex: /s/, value: date.getSeconds() },
        milliseconds: { regex: /tt/, value: date.getMilliseconds() > 9 ? date.getMilliseconds() : '0' + date.getMilliseconds() },
        millisecondsSingle: { regex: /t/, value: date.getMilliseconds() }
    }

    for (let key in attrs) {
        if (attrs[key].regex.test) {
            result = result.replace(attrs[key].regex, attrs[key].value);
        }
    }

    return result;
}