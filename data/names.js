/* ── Namensgenerator ───────────────────────────────────────────────────
   Pro Namensregion Vor- und Nachnamen. Wird für den eigenen Spieler
   (Würfel-Knopf) und für NPCs (Mitspieler, Rivalen, Trainer) genutzt. */

window.FKC = window.FKC || {};
FKC.data = FKC.data || {};

(function (FKC) {
  'use strict';

  function S(str) { return str.split(' '); }

  var names = {
    en: {
      first: S('Jack Harry Callum Ethan Mason Leo Reece Kieran Owen Tyler Lewis Josh Connor Alfie Riley Marcus Declan Jamie Nathan Freddie'),
      last:  S('Walker Bennett Hughes Thornton Fletcher Whitmore Ashcroft Kingsley Hartley Sinclair Braddock Marsden Quinn Ellison Radcliffe Doherty Wainwright Lowery Beckett Sharpe')
    },
    de: {
      first: S('Luca Jonas Finn Noah Elias Maximilian Tim Leon Niklas Julian Marvin Fabian Jannik Philipp Lennard Tobias Moritz Simon Hendrik Kilian'),
      last:  S('Neumann Brandt Krüger Wagner Hoffmann Böhm Reinhardt Schindler Vogelsang Ackermann Steinbach Lindner Kaltenbach Rösler Eichhorn Wendland Marquardt Sommer Fassbender Grothe')
    },
    ch: {
      first: S('Nico Silvan Ramon Yannick Andrin Loris Fabio Joel Timo Cédric Gian Marco Levin Robin Dario Elia Nevio Sandro Jaron Lian'),
      last:  S('Blättler Zimmerli Amrein Furrer Bachmann Steinegger Widmer Hodel Brunner Gasser Rüegg Zbinden Frei Schwegler Aebischer Hunziker Meier Bühler Marending Stalder')
    },
    es: {
      first: S('Álvaro Iker Hugo Marco Rubén Sergio Adrián Pablo Nacho Iván Aitor Bruno Dani Unai Gonzalo Javi Mateo Óscar Rodri Aleix'),
      last:  S('Vidal Serrano Cabrera Molina Peralta Ibáñez Aranda Quintana Salvador Ferrer Márquez Redondo Barragán Escudero Villalba Otero Camacho Zamora Roldán Bermejo')
    },
    it: {
      first: S('Matteo Lorenzo Andrea Riccardo Davide Simone Federico Alessio Giacomo Nicolò Tommaso Filippo Samuele Gianluca Emanuele Cristian Pietro Manuel Luca Edoardo'),
      last:  S('Ferrara Rinaldi Cattaneo Bianchini Moretti Zanetti Fabbri Lombardi Pellegrini Marchetti Caruso Bellini Vitale Sartori Grasso Fontana Baldini Sorrentino Basso Milani')
    },
    fr: {
      first: S('Enzo Théo Nathan Maxence Ilyes Gabin Corentin Yanis Baptiste Mathis Rayan Tristan Amaury Jules Léandre Kylian Ousmane Noé Lucas Élias'),
      last:  S('Lemoine Bertrand Chevalier Marchand Rousseau Delaunay Fournier Barbier Vasseur Guérin Lambert Perrin Mercier Bouchard Trémaux Aubert Delacroix Nabil Sagnol Duverger')
    },
    pt: {
      first: S('Rúben Diogo Tiago Gonçalo Rafael Vasco Duarte Miguel Bernardo Afonso Rodrigo Tomás Nuno Fábio Ivo André Salvador Martim Dinis Hugo'),
      last:  S('Fonseca Carvalho Sousa Teixeira Machado Cardoso Moreira Azevedo Nogueira Pinheiro Braga Fernandes Rocha Barreto Amorim Quaresma Vilela Soares Trindade Salgado')
    },
    nl: {
      first: S('Sven Daan Thijs Jurriën Bram Ruben Stijn Kai Milan Jesse Tycho Sepp Joep Lars Niek Ravi Youri Guus Teun Cas'),
      last:  S('van Dijk Bakker Hendriks Vermeer de Boer Kuiper Jansen Willemsen van Leeuwen Bosma Verhoeven Klaassen Nieuwenhuis Dekker Groenveld Terlouw van Rijn Sloot Brouwer Heemskerk')
    },
    tr: {
      first: S('Emre Berkay Kerem Arda Yusuf Baran Ozan Kaan Cengiz Onur Efe Mert Deniz Umut Barış Sinan Tolga Halil Serkan Doruk'),
      last:  S('Yılmaz Demir Kaya Çelik Şahin Yıldız Aydın Özdemir Arslan Doğan Kurt Koç Aksoy Erdoğan Bulut Taş Güneş Polat Karataş Öztürk')
    },
    br: {
      first: S('Gabriel Lucas Matheus Rafael Vinícius Caio Bruno Danilo Éder Wesley Igor Murilo Thiago Léo Kaio Douglas Everton Ronaldo Felipe Yuri'),
      last:  S('Silva Oliveira Ferreira Almeida Barbosa Nascimento Ribeiro Nogueira Cardoso Batista Andrade Souza Machado Teixeira Soares Moraes Duarte Rezende Bittencourt Vasconcelos')
    },
    ar: {
      first: S('Nicolás Santiago Julián Facundo Tomás Lautaro Agustín Franco Valentín Gonzalo Emiliano Bautista Thiago Joaquín Máximo Ignacio Ramiro Lisandro Benjamín Ezequiel'),
      last:  S('Fernández Gómez Sosa Acosta Benítez Cabrera Aguirre Ledesma Ruiz Ortega Paredes Godoy Medina Ríos Cáceres Vergara Núñez Ávalos Zárate Ferreyra')
    },
    'ar-sa': {
      first: S('Faisal Abdullah Salem Yousef Khalid Nasser Majed Turki Rakan Ziyad Bandar Fahad Ahmed Sultan Ibrahim Saud Talal Waleed Mansour Hamad'),
      last:  S('Al-Harbi Al-Dossari Al-Qahtani Al-Shehri Al-Ghamdi Al-Otaibi Al-Zahrani Al-Malki Al-Anazi Al-Subaie Al-Amri Al-Faraj Al-Hassan Al-Najjar Al-Rashid Al-Sultan Al-Yami Al-Khaldi Al-Balawi Al-Mutairi')
    },
    scand: {
      first: S('Emil Oskar Mathias Jonas Kasper Viktor Sander Aksel Nikolai Elias Filip Anton Sebastian Magnus Henrik Tobias Rasmus Jesper Erling Alfred'),
      last:  S('Nygaard Lindqvist Aasen Bergström Halvorsen Söderberg Kristiansen Lundgren Dahl Fredriksen Ekström Hagen Norberg Sandberg Vik Brekke Jönsson Holt Rødseth Sylvest')
    },
    balkan: {
      first: S('Luka Marko Ivan Stefan Nikola Petar Josip Filip Dario Mateo Vukašin Andrej Borna Lovro Uroš Dušan Toma Vedran Ante Milan'),
      last:  S('Kovačević Marković Perišić Vlašić Jovanović Babić Radulović Stanković Horvat Šimić Petrović Milinković Brekalo Đurić Katić Novak Bogdanović Zubčić Maričić Vranješ')
    },
    pl: {
      first: S('Kacper Jakub Filip Bartosz Mateusz Szymon Piotr Michał Kamil Adrian Dawid Krzysztof Wojciech Tomasz Damian Oskar Igor Marcin Sebastian Nikodem'),
      last:  S('Kowalczyk Nowak Wójcik Lewandowski Zieliński Kaczmarek Piątek Szymański Grabowski Dąbrowski Krawczyk Baran Sikora Michalak Głowacki Adamczyk Sokołowski Wieczorek Jankowski Bednarek')
    },
    cz: {
      first: S('Jakub Tomáš Ondřej Vojtěch Adam Filip Matěj Lukáš Daniel Patrik Martin Petr David Marek Jan Šimon Radek Dominik Michal Václav'),
      last:  S('Novák Svoboda Dvořák Černý Procházka Kučera Veselý Horák Němec Marek Pospíšil Hájek Jelínek Král Beneš Fiala Sedláček Doležal Zeman Kolář')
    },
    ua: {
      first: S('Andrii Danylo Maksym Bohdan Oleksii Yaroslav Vladyslav Artem Mykyta Denys Roman Ivan Serhii Taras Illia Pavlo Nazar Ruslan Yurii Kyrylo'),
      last:  S('Shevchenko Kovalenko Bondarenko Tkachenko Melnyk Kravchuk Zinchenko Yaremchuk Lysenko Marchenko Pavlov Rudenko Sydorenko Horbach Kolesnyk Savchenko Petrenko Dovbyk Tsyhankov Malinovskyi')
    },
    gr: {
      first: S('Giorgos Dimitris Nikos Kostas Vasilis Panagiotis Christos Thanasis Stelios Manolis Andreas Petros Alexis Ilias Sotiris Lefteris Tasos Michalis Fotis Yannis'),
      last:  S('Papadopoulos Nikolaidis Georgiou Vlachos Karagiannis Samaras Antoniou Dimitriou Christou Mavridis Katsaros Stavrou Pavlidis Fotakis Zafeiris Bakasetas Masouras Giannoulis Retsos Kourbelis')
    },
    ro: {
      first: S('Andrei Alexandru Ionuț Cristian Vlad Răzvan Mihai Darius Bogdan Florin Denis Sergiu Gabriel Valentin Octavian Cătălin Adrian Marius Nicolae Iulian'),
      last:  S('Popescu Ionescu Radu Stoica Dumitrescu Marin Constantin Munteanu Nistor Ciobanu Petrescu Vasile Dragomir Anghel Iordache Cristea Bâlbâe Olaru Mitriță Coman')
    },
    hu: {
      first: S('Bence Máté Levente Dániel Ádám Zsolt Gergő Balázs Kristóf Milán Áron Botond Tamás Márton Roland Attila Norbert Szabolcs Krisztián Dominik'),
      last:  S('Nagy Kovács Tóth Szabó Horváth Varga Kiss Molnár Németh Farkas Balogh Lakatos Fekete Sallai Szoboszlai Gulácsi Orbán Schäfer Bolla Nego')
    },
    ru: {
      first: S('Ivan Dmitri Sergei Nikita Artem Egor Maxim Kirill Pavel Anton Roman Andrei Aleksandr Danil Timur Vladislav Fedor Grigori Matvei Stepan'),
      last:  S('Ivanov Smirnov Kuznetsov Popov Sokolov Volkov Fedorov Morozov Golovin Miranchuk Zakharov Nikolaev Orlov Karpin Safonov Chalov Kudryashov Tarasov Barinov Zhirkov')
    },
    maghreb: {
      first: S('Youssef Amine Anas Bilal Mehdi Ilyas Ayoub Zakaria Reda Hamza Sofiane Nabil Karim Riyad Hakim Achraf Yassine Adam Walid Ismail'),
      last:  S('Benali Hakimi Cherif Ziyech Boufal Amrabat Benzia Mazraoui Ounahi Saïss Bounou Belhanda Slimani Mahrez Attal Bennacer Zerrouki Chaïbi Naïm El Aynaoui')
    },
    wafr: {
      first: S('Idrissa Mamadou Cheikh Abdoulaye Boubacar Ousmane Lamine Seydou Moussa Ibrahima Sadio Kalidou Nicolas Franck Serge Kelechi Victor Wilfried Emmanuel Bright'),
      last:  S('Diop Diallo Traoré Camara Coulibaly Ndiaye Sarr Koné Sow Touré Keita Bamba Adeyemi Okonkwo Ocheke Mensah Boateng Asante Kouassi Zoungrana')
    },
    jp: {
      first: S('Ren Haruto Sota Yuto Riku Kaito Takumi Sora Daiki Hayato Kenta Yuki Ryo Shota Kazuki Naoki Takuma Ayumu Itsuki Minato'),
      last:  S('Tanaka Yamamoto Nakamura Kobayashi Watanabe Saito Kato Endo Mitoma Kubo Furuhashi Doan Ito Morita Tomiyasu Hasebe Sugimoto Nagatomo Asano Kamada')
    },
    kr: {
      first: S('Minjae Heungmin Jaesung Woobin Seungho Jinsu Hyunwoo Taehyun Junho Dongjun Sanghyun Kyungmin Yeonwoo Chanho Sungjin Daehyun Jiho Hoyeon Namgoong Seokjin'),
      last:  S('Kim Lee Park Choi Jung Kang Cho Yoon Jang Lim Han Оh Seo Shin Kwon Hwang Ahn Song Ryu Baek Oh')
    }
  };

  FKC.data.names = names;

  FKC.data.randomName = function (regionOrNation) {
    var region = names[regionOrNation] ? regionOrNation : null;
    if (!region) {
      var n = FKC.data.nationById(regionOrNation);
      region = n && names[n.nameRegion] ? n.nameRegion : 'en';
    }
    var pool = names[region];
    return {
      first: FKC.rng.pick(pool.first),
      last: FKC.rng.pick(pool.last)
    };
  };

})(window.FKC);
