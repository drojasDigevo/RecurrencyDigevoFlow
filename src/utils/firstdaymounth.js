const moment = require("moment");

exports.getFirstMondayWithAddedMonths = function (date, monthsToAdd) {
    // Crear un objeto moment a partir de la fecha proporcionada y agregar los meses
    let startDate = moment(date).date(1).add(monthsToAdd, 'months');

    let hour = startDate.hour();
    let minute = startDate.minute();
    let second = startDate.second();

    if (hour < 6) 
    { 
        hour = 6 + hour; 
    } 

    // Establecer el día al primer día del mes, manteniendo la hora
    startDate.startOf('month').hour(hour).minute(minute).second(second);

    // Calcular el desplazamiento para llegar al primer lunes
    const dayOfWeek = startDate.day(); // Día de la semana del primer día del mes (0 = domingo, 1 = lunes, ..., 6 = sábado)
    const offset = (dayOfWeek === 0) ? 1 : (8 - dayOfWeek) % 7;

    // Ajustar la fecha para obtener el primer lunes
    startDate.add(offset, 'days');

    //startDate.format("YYYY-MM-DD HH:mm:ss");

    return startDate;
}

exports.getFirstMondayWithAddedDays = function (date, monthsToAdd) {
    // Crear un objeto moment a partir de la fecha proporcionada y agregar los dias
    let startDate = moment(date).date(1).add(monthsToAdd, 'days');

    let hour = startDate.hour();
    let minute = startDate.minute();
    let second = startDate.second();

    if (startDate.hour() < 6) 
    { 
        hour = 6 + hour; 
    } 

    // Establecer el día al primer día del mes, manteniendo la hora
    startDate.startOf('month').hour(hour).minute(minute).second(second);

    // Calcular el desplazamiento para llegar al primer lunes
    const dayOfWeek = startDate.day(); // Día de la semana del primer día del mes (0 = domingo, 1 = lunes, ..., 6 = sábado)
    const offset = (dayOfWeek === 0) ? 1 : (8 - dayOfWeek) % 7;

    // Ajustar la fecha para obtener el primer lunes
    startDate.add(offset, 'days');

    //startDate.format("YYYY-MM-DD HH:mm:ss");

    return startDate;
}