const fetch = require('node-fetch');
const cheerio = require('cheerio');

const searchCache = {};
const movieCache = {};

const searchUrl =
	'https://www.imdb.com/list/ls083906744/?pf_rd_m=A2FGELUUNOQJNL&pf_rd_p=4dc7ad1a-76a6-49eb-9acb-5d6959572df8&pf_rd_r=Y5N3BKEJHZ18798FC8G2&pf_rd_s=right-4&pf_rd_t=48201&pf_rd_i=watchlist&ref_=wt_otl_1';
const movieUrl = 'https://www.imdb.com/title/';

function searchMovies(searchTerm) {
	if (searchCache[searchTerm]) {
		return Promise.result(searchCache[searchTerm]);
	}
	return fetch(`${searchUrl}${searchTerm}`)
		.then((response) => response.text())
		.then((body) => {
			const $ = cheerio.load(body);
			const movies = [];
			$('.lister-item').each(function (i, elem) {
				const $elem = $(elem);
				const $poster = $elem.find('.lister-item-image a img');
				const $title = $elem.find('.lister-item-content h3 a');
				const imdbID = $title.attr('href').match(/title\/(.*)\//);
				const $year = $elem.find('.lister-item-content h3 .lister-item-year');
				const $genre = $elem.find('.lister-item-content p .genre');

				const movie = {
					imdbID,
					poster: $poster.attr('src'),
					title: $title.text(),
					year: $year.text(),
					genre: $genre.text().trim(),
				};

				movies.push(movie);
				// console.log($elem.attr('href'));
			});

			searchCache[searchTerm] = movies;

			return movies;
		});
}

function getMovie(imdbID) {
	if (movieCache[imdbID]) {
		return Promise.resolve(movieCache[imdbID]);
	}
	return fetch(`${movieUrl}${imdbID}`)
		.then((response) => response.text())
		.then((body) => {
			const $ = cheerio.load(body);
			const $title = $('.title_wrapper h1');

			const title = $title
				.first()
				.contents()
				.filter(function () {
					return this.type === 'text';
				})
				.text()
				.trim();

			const poster = $('.poster a img').attr('src');
			const summary = $('.summary_text').text().trim();
			const directors = $('.credit_summary_item:nth-child(2) a').text();
			const trailer = $('.slate a').attr('href');

			const movie = {
				title,
				poster,
				summary,
				directors,
				trailer: `https://imdb.com${trailer}`,
			};

			movieCache[imdbID] = movie;

			return movie;
		});
}

module.exports = {
	searchMovies,
	getMovie,
};
