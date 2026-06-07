import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';

const GET_USERS = gql`query { users { id name email role createdAt } }`;
const CREATE_USER = gql`mutation CreateUser($name: String!, $email: String!, $role: String) {
  createUser(name: $name, email: $email, role: $role) { id name email role }
}`;
const DELETE_USER = gql`mutation DeleteUser($id: ID!) { deleteUser(id: $id) }`;
const UPDATE_USER = gql`mutation UpdateUser($id: ID!, $name: String, $email: String, $role: String) {
  updateUser(id: $id, name: $name, email: $email, role: $role) { id name email role }
}`;

const GET_PRODUCTS = gql`query { products { id name description price stock category } }`;
const CREATE_PRODUCT = gql`mutation CreateProduct($name: String!, $price: Float!, $description: String, $stock: Int, $category: String) {
  createProduct(name: $name, price: $price, description: $description, stock: $stock, category: $category) { id name price stock }
}`;
const DELETE_PRODUCT = gql`mutation DeleteProduct($id: ID!) { deleteProduct(id: $id) }`;
const UPDATE_PRODUCT = gql`mutation UpdateProduct($id: ID!, $name: String, $price: Float, $stock: Int, $category: String) {
  updateProduct(id: $id, name: $name, price: $price, stock: $stock, category: $category) { id name price stock }
}`;

const GET_ORDERS = gql`query { orders { id userId productIds status totalPrice address createdAt } }`;
const CREATE_ORDER = gql`mutation CreateOrder($userId: ID!, $productIds: [ID!]!, $totalPrice: Float!, $address: String) {
  createOrder(userId: $userId, productIds: $productIds, totalPrice: $totalPrice, address: $address) { id status totalPrice }
}`;
const UPDATE_ORDER_STATUS = gql`mutation UpdateOrderStatus($id: ID!, $status: String!) {
  updateOrderStatus(id: $id, status: $status) { id status }
}`;
const DELETE_ORDER = gql`mutation DeleteOrder($id: ID!) { deleteOrder(id: $id) }`;

function UsersTab() {
  const { data, loading, error, refetch } = useQuery(GET_USERS);
  const [createUser] = useMutation(CREATE_USER, { onCompleted: () => refetch() });
  const [deleteUser] = useMutation(DELETE_USER, { onCompleted: () => refetch() });
  const [updateUser] = useMutation(UPDATE_USER, { onCompleted: () => { setEditing(null); refetch(); } });

  const [form, setForm] = useState({ name: '', email: '', role: 'customer' });
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});

  const handleCreate = (e) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    createUser({ variables: form });
    setForm({ name: '', email: '', role: 'customer' });
  };

  if (loading) return <div className="loading">Загрузка...</div>;
  if (error) return <div className="error">Ошибка: {error.message}</div>;

  return (
    <div>
      <form onSubmit={handleCreate}>
        <h3>Добавить пользователя</h3>
        <div className="form-row">
          <input placeholder="Имя" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <input placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
            <option value="customer">customer</option>
            <option value="admin">admin</option>
          </select>
        </div>
        <button className="btn btn-primary" type="submit">Создать</button>
      </form>

      <h2>Пользователи ({data.users.length})</h2>
      <div className="grid">
        {data.users.map(u => (
          <div className="card" key={u.id}>
            {editing === u.id ? (
              <>
                <div className="form-row">
                  <input value={editForm.name || ''} onChange={e => setEditForm({ ...editForm, name: e.target.value })} placeholder="Имя" />
                  <input value={editForm.email || ''} onChange={e => setEditForm({ ...editForm, email: e.target.value })} placeholder="Email" />
                  <select value={editForm.role || 'customer'} onChange={e => setEditForm({ ...editForm, role: e.target.value })}>
                    <option value="customer">customer</option>
                    <option value="admin">admin</option>
                  </select>
                </div>
                <div className="actions">
                  <button className="btn btn-primary btn-sm" onClick={() => updateUser({ variables: { id: u.id, ...editForm } })}>Сохранить</button>
                  <button className="btn btn-sm" onClick={() => setEditing(null)}>Отмена</button>
                </div>
              </>
            ) : (
              <>
                <h3>{u.name}</h3>
                <p>{u.email}</p>
                <p><span className={`badge ${u.role}`}>{u.role}</span></p>
                <div className="actions">
                  <button className="btn btn-primary btn-sm" onClick={() => { setEditing(u.id); setEditForm({ name: u.name, email: u.email, role: u.role }); }}>Изменить</button>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteUser({ variables: { id: u.id } })}>Удалить</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductsTab() {
  const { data, loading, error, refetch } = useQuery(GET_PRODUCTS);
  const [createProduct] = useMutation(CREATE_PRODUCT, { onCompleted: () => refetch() });
  const [deleteProduct] = useMutation(DELETE_PRODUCT, { onCompleted: () => refetch() });
  const [updateProduct] = useMutation(UPDATE_PRODUCT, { onCompleted: () => { setEditing(null); refetch(); } });

  const [form, setForm] = useState({ name: '', price: '', description: '', stock: '', category: '' });
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});

  const handleCreate = (e) => {
    e.preventDefault();
    if (!form.name || !form.price) return;
    createProduct({ variables: { ...form, price: parseFloat(form.price), stock: parseInt(form.stock) || 0 } });
    setForm({ name: '', price: '', description: '', stock: '', category: '' });
  };

  if (loading) return <div className="loading">Загрузка...</div>;
  if (error) return <div className="error">Ошибка: {error.message}</div>;

  return (
    <div>
      <form onSubmit={handleCreate}>
        <h3>Добавить товар</h3>
        <div className="form-row">
          <input placeholder="Название" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <input placeholder="Цена" type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
          <input placeholder="Остаток" type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} />
          <input placeholder="Категория" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
          <input placeholder="Описание" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>
        <button className="btn btn-primary" type="submit">Создать</button>
      </form>

      <h2>Товары ({data.products.length})</h2>
      <div className="grid">
        {data.products.map(p => (
          <div className="card" key={p.id}>
            {editing === p.id ? (
              <>
                <div className="form-row">
                  <input value={editForm.name || ''} onChange={e => setEditForm({ ...editForm, name: e.target.value })} placeholder="Название" />
                  <input value={editForm.price || ''} type="number" onChange={e => setEditForm({ ...editForm, price: parseFloat(e.target.value) })} placeholder="Цена" />
                  <input value={editForm.stock || ''} type="number" onChange={e => setEditForm({ ...editForm, stock: parseInt(e.target.value) })} placeholder="Остаток" />
                  <input value={editForm.category || ''} onChange={e => setEditForm({ ...editForm, category: e.target.value })} placeholder="Категория" />
                </div>
                <div className="actions">
                  <button className="btn btn-primary btn-sm" onClick={() => updateProduct({ variables: { id: p.id, ...editForm } })}>Сохранить</button>
                  <button className="btn btn-sm" onClick={() => setEditing(null)}>Отмена</button>
                </div>
              </>
            ) : (
              <>
                <h3>{p.name}</h3>
                <p className="price">{p.price} ₽</p>
                <p>Остаток: {p.stock} шт.</p>
                {p.category && <p>Категория: {p.category}</p>}
                {p.description && <p style={{ color: '#999', fontSize: 12 }}>{p.description}</p>}
                <div className="actions">
                  <button className="btn btn-primary btn-sm" onClick={() => { setEditing(p.id); setEditForm({ name: p.name, price: p.price, stock: p.stock, category: p.category }); }}>Изменить</button>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteProduct({ variables: { id: p.id } })}>Удалить</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function OrdersTab() {
  const { data, loading, error, refetch } = useQuery(GET_ORDERS);
  const [createOrder] = useMutation(CREATE_ORDER, { onCompleted: () => refetch() });
  const [updateOrderStatus] = useMutation(UPDATE_ORDER_STATUS, { onCompleted: () => refetch() });
  const [deleteOrder] = useMutation(DELETE_ORDER, { onCompleted: () => refetch() });

  const [form, setForm] = useState({ userId: '', productIds: '', totalPrice: '', address: '' });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!form.userId || !form.productIds || !form.totalPrice) return;
    createOrder({
      variables: {
        userId: form.userId,
        productIds: form.productIds.split(',').map(s => s.trim()),
        totalPrice: parseFloat(form.totalPrice),
        address: form.address,
      }
    });
    setForm({ userId: '', productIds: '', totalPrice: '', address: '' });
  };

  const statuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

  if (loading) return <div className="loading">Загрузка...</div>;
  if (error) return <div className="error">Ошибка: {error.message}</div>;

  return (
    <div>
      <form onSubmit={handleCreate}>
        <h3>Создать заказ</h3>
        <div className="form-row">
          <input placeholder="ID пользователя" value={form.userId} onChange={e => setForm({ ...form, userId: e.target.value })} required />
          <input placeholder="ID товаров (через запятую)" value={form.productIds} onChange={e => setForm({ ...form, productIds: e.target.value })} required />
          <input placeholder="Сумма" type="number" step="0.01" value={form.totalPrice} onChange={e => setForm({ ...form, totalPrice: e.target.value })} required />
          <input placeholder="Адрес доставки" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
        </div>
        <button className="btn btn-primary" type="submit">Создать</button>
      </form>

      <h2>Заказы ({data.orders.length})</h2>
      <div className="grid">
        {data.orders.map(o => (
          <div className="card" key={o.id}>
            <h3>Заказ #{o.id.slice(-6)}</h3>
            <p>Пользователь: {o.userId}</p>
            <p className="price">{o.totalPrice} ₽</p>
            {o.address && <p>Адрес: {o.address}</p>}
            <p><span className={`badge ${o.status}`}>{o.status}</span></p>
            <div className="actions" style={{ flexWrap: 'wrap' }}>
              <select
                value={o.status}
                onChange={e => updateOrderStatus({ variables: { id: o.id, status: e.target.value } })}
                style={{ flex: 1 }}
              >
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button className="btn btn-danger btn-sm" onClick={() => deleteOrder({ variables: { id: o.id } })}>Удалить</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState('users');
  return (
    <>
      <nav>
        <h1>GraphQL Shop</h1>
        <button className={tab === 'users' ? 'active' : ''} onClick={() => setTab('users')}>Пользователи</button>
        <button className={tab === 'products' ? 'active' : ''} onClick={() => setTab('products')}>Товары</button>
        <button className={tab === 'orders' ? 'active' : ''} onClick={() => setTab('orders')}>Заказы</button>
      </nav>
      <div className="container">
        {tab === 'users' && <UsersTab />}
        {tab === 'products' && <ProductsTab />}
        {tab === 'orders' && <OrdersTab />}
      </div>
    </>
  );
}
