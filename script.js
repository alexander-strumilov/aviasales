document.addEventListener('DOMContentLoaded', () => {

    // Elements
    const formSearch = document.querySelector('.form-search'),
        inputCitiesFrom = formSearch.querySelector('.input__cities-from'),
        dropdownCitiesFrom = formSearch.querySelector('.dropdown__cities-from'),
        inputCitiesTo = formSearch.querySelector('.input__cities-to'),
        dropdownCitiesTo = formSearch.querySelector('.dropdown__cities-to'),
        inputDateDepart = formSearch.querySelector('.input__date-depart'),
        cheapTicketSection = document.getElementById('cheapest-ticket'),
        allTicketsSection = document.getElementById('all-tickets'),
        ticketsSection = document.getElementById('tickets');

    const citiesAPI = 'http://api.travelpayouts.com/data/ru/cities.json',
        proxy = 'https://cors-anywhere.herokuapp.com/',
        TOKEN = '6f62af000c602a0d8bfcb5fec25403e2',
        calendarAPI = 'http://min-prices.aviasales.ru/calendar_preload';

    const maxCountElements = 10;
    let pages = 0;

    let cities = [],
        citiesList = [];

    // Functions
    const showCities = (input, list) => {
        list.innerHTML = '';

        if (input.value.length === 0) {
            return;
        }
        input.setCustomValidity('');

        let filtered = cities.filter(element => {
            let lowerItem = element.name.toLowerCase();
            return lowerItem.startsWith(input.value);
        });

        sortByName(filtered);

        filtered.forEach(element => {
            let city = document.createElement('li');
            city.classList.add('dropdown__city');
            city.innerHTML = element.name;
            city.setAttribute('data-code', element.code);
            list.append(city);
            console.log('element :', element);
        });
    };

    const selectCity = (e, input, list) => {
        let target = e.target;
        if (target.matches('li.dropdown__city')) {
            input.value = target.textContent;
            input.setAttribute('data-code', target.dataset.code);
            list.innerHTML = '';
        }
    };

    const sortByName = (arr) => {
        arr.sort((a, b) => a.name > b.name ? 1 : -1);
    }

    const sortByPrice = (arr) => {
        arr.sort((a, b) => a.value > b.value ? 1 : -1);
    }

    const validateCity = (input, list) => {
        let city = list.find(item => item == input.value);
        if (!city) {
            input.setCustomValidity("We don't have this city on our planet!");
            return city;
        } else {
            return city;
        }
    }

    const convertDate = (date) => {
        let [year, month, day] = date.split('-');
        let monthName = new Date(year, month, day).toLocaleString('ru', {       
            month: 'long'       
            });

        return `${day} ${monthName} ${year}`;
    };

    const getData = (url) => {
        return new Promise((resolve, reject) => {
            const request = new XMLHttpRequest();

            request.open('GET', url);
            request.addEventListener('readystatechange', () => {
                if (request.readyState !== 4) {
                    return;
                }
                if (request.status === 200) {
                    resolve(request.response);
                } else {
                    reject(new Error());
                }
            });
            request.send();
        });
    };


    const getCheapestFlight = (flight) => {
        console.log('flight:', flight);

        cheapTicketSection.innerHTML = '<h2>Самый дешевый билет на выбранную дату</h2>';

        renderTicket(flight, (card) => {
            cheapTicketSection.append(card);
        });
    };

    const getAllFlights = (flights) => {
        console.log('flights:', flights);

        if (pages == 0) {
            allTicketsSection.innerHTML = '<h2>Самые дешевые билеты на другие даты</h2>';
        }

        for (let i = pages; i < flights.length & i < maxCountElements + pages; i++) {
            console.log('i :', i);
            console.log('flights.length :', flights.length);
            console.log('maxCountElements + pages :', maxCountElements + pages);
            renderTicket(flights[i], (card) => {
                allTicketsSection.append(card);
                console.log('cardFromTheLoop :', card);
            });
        }
        pages += 10;
        allTicketsSection.insertAdjacentHTML('beforeend', '<hr>');
        console.log('pages :', pages);

    };

    const getDataFlights = (data) => {
        const allFlights = data.best_prices;

        const cheapestFlight = data.best_prices.filter(element => element.depart_date == inputDateDepart.value)[0];

        sortByPrice(allFlights);

        getCheapestFlight(cheapestFlight);
        getAllFlights(allFlights);

        ticketsSection.classList.add('loading');

        setTimeout(() => {
            ticketsSection.classList.remove('loading');
        }, 1000);
    };

    const renderTicket = (element, callback) => {
        let card = document.createElement('article');
        card.classList.add('ticket');

        const flightData = {
            gate: element.gate,
            price: element.value,
            from: element.origin,
            to: element.destination,
            changes: element.number_of_changes == 0 ? 'Без пересадок' : 'Количество пересадок: ' + element.number_of_changes,
            fromName: () => {
                let city = cities.find(item => item.code == element.origin);
                return city.name;
            },
            departDate: convertDate(element.depart_date),
            returnDate: convertDate(element.return_date),
            toName: () => {
                let city = cities.find(item => item.code == element.destination);
                return city.name;
            },
            link: () => {
                let link = 'https://www.aviasales.ru/search/';
                let [year, month, day] = element.depart_date.split('-');

                return link + element.origin + day + month + element.destination + '1';
            }
        }

        let html = '';

        if (element) {
            html = `<h3 class="agent">${flightData.gate}</h3>
                        <div class="ticket__wrapper">
                            <div class="left-side">
                                <a href="${flightData.link()}" class="button button__buy">Купить
                                    за ${flightData.price}₽</a>
                            </div>
                            <div class="right-side">
                                <div class="block-left">
                                    <div class="city__from">Вылет из города:
                                        <span class="city__name">${flightData.fromName()}</span>
                                    </div>
                                    <div class="date">${flightData.departDate}</div>
                                </div>
                        
                                <div class="block-right">
                                    <div class="changes">${flightData.changes}</div>
                                    <div class="city__to">Город назначения:
                                        <span class="city__name">${flightData.toName()}</span>
                                    </div>
                                </div>
                            </div>
                            <div></i>Обратно: ${flightData.returnDate}</i></div>
                        </div>`;
        } else {
            html = `<h3>Билетов нет</h3>`
        }

        card.insertAdjacentHTML('afterbegin', html);

        callback(card);
    };

    // Form actions
    inputCitiesFrom.addEventListener('input', () => {
        showCities(inputCitiesFrom, dropdownCitiesFrom)
    });
    inputCitiesTo.addEventListener('input', () => {
        showCities(inputCitiesTo, dropdownCitiesTo)
    });

    dropdownCitiesFrom.addEventListener('click', (e) => {
        selectCity(e, inputCitiesFrom, dropdownCitiesFrom);
    });

    dropdownCitiesTo.addEventListener('click', (e) => {
        selectCity(e, inputCitiesTo, dropdownCitiesTo);
    });

    // Form request
    formSearch.addEventListener('submit', (e) => {

        e.preventDefault();

        let validatedFrom = validateCity(inputCitiesFrom, citiesList);
        console.log('validatedFrom :', validatedFrom);
        let validatedTo = validateCity(inputCitiesTo, citiesList);
        console.log('validatedTo :', validatedTo);

        if(validatedFrom === undefined || validatedTo === undefined) {
            return false;
        }

        console.log('cities :', cities);

        const formData = {
                from: inputCitiesFrom.dataset.code,
                to: inputCitiesTo.dataset.code,
                depart: inputDateDepart.value,
                oneWay: false
            };

        const queryString = `?depart_date=${formData.depart}&origin=${formData.from}&destination=${formData.to}&one_way=${formData.oneWay}&token=${TOKEN}`;

        getData(calendarAPI + queryString)
            .then(response => JSON.parse(response))
            .then(json => {
                getDataFlights(json);
            })
            .catch(error => console.log(error));

    });

    // Getting data to start
    getData(proxy + citiesAPI)
        .then(response => {
            console.log(response)
            return JSON.parse(response);
        })
        .then(json => {
            console.log(json);

            let filtered = json.filter(element => {
                return element.name;
            });
            cities = filtered;

            let filteredCitiesList = filtered.map(item => item.name);
            citiesList = filteredCitiesList;
        })
        .catch(error => console.log(error));

        // var mutationObserver = new MutationObserver((mutations) => {
        //     mutations.forEach((mutation) => {
        //       console.log(mutation);
        //     });
        //   });

        //   mutationObserver.observe(wrapper, {
        //     attributes: true,
        //     attributeOldValue: true
        //   });

        // console.log('MutationRecord.addedNodes :', MutationRecord.addedNodes);
          

});