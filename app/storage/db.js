// import * as SQLite from 'expo-sqlite';

// const db = SQLite.openDatabase('linx.db');

// // Funzione per creare le tabelle
// export const createTables = () => {
//   db.transaction(tx => {
//     // Creazione della tabella delle categorie
//     tx.executeSql(
//       'CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT);'
//     );
//     // Creazione della tabella dei link
//     tx.executeSql(
//       'CREATE TABLE IF NOT EXISTS links (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, url TEXT, category_id INTEGER, FOREIGN KEY(category_id) REFERENCES categories(id));'
//     );
//   });
// };

// // Funzione per aggiungere una nuova categoria
// export const saveCategory = (name) => {
//   db.transaction(tx => {
//     tx.executeSql('INSERT INTO categories (name) VALUES (?)', [name]);
//   });
// };

// // Funzione per aggiungere un nuovo link
// export const saveLink = (title, url, category_id) => {
//   db.transaction(tx => {
//     tx.executeSql('INSERT INTO links (title, url, category_id) VALUES (?, ?, ?)', [title, url, category_id]);
//   });
// };

// // Funzione per ottenere tutte le categorie e i link associati
// export const getCategoriesWithLinks = (setCategories) => {
//   db.transaction(tx => {
//     tx.executeSql(
//       'SELECT categories.id as category_id, categories.name as category_name, links.id as link_id, links.title as link_title, links.url as link_url FROM categories LEFT JOIN links ON categories.id = links.category_id;',
//       [],
//       (_, { rows }) => {
//         const data = rows._array.reduce((acc, row) => {
//           let category = acc.find(cat => cat.id === row.category_id);
//           if (!category) {
//             category = { id: row.category_id, name: row.category_name, items: [] };
//             acc.push(category);
//           }
//           if (row.link_id) {
//             category.items.push({ title: row.link_title, url: row.link_url });
//           }
//           return acc;
//         }, []);
//         setCategories(data);
//       }
//     );
//   });
// };