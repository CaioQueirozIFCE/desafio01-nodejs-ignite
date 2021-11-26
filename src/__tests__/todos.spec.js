const request = require('supertest');
const { validate } = require('uuid');

const app = require('../');

describe('Todos', () => {
  it("should be able to list all user's todo", async () => {
    const userResponse = await request(app)
      .post('/users')
      .send({
        name: 'John Doe',
        username: 'user1'
      });

    const todoDate = new Date();

    const todoResponse = await request(app)
      .post('/todos')
      .send({
        title: 'test todo',
        deadline: todoDate
      })
      .set('username', JSON.parse(userResponse.text)?.user?.username);

    const response = await request(app)
      .get('/todos')
      .set('username', JSON.parse(userResponse.text)?.user?.username);

    expect(JSON.parse(response?.text)?.todos).toEqual(
      expect.arrayContaining([
        JSON.parse(todoResponse.text)?.user?.todos
      ]),
    )
  });

  it('should be able to create a new todo', async () => {
    const userResponse = await request(app)
      .post('/users')
      .send({
        name: 'John Doe',
        username: 'user2'
      });

    const todoDate = new Date();

    const response = await request(app)
      .post('/todos')
      .send({
        title: 'test todo',
        deadline: todoDate
      })
      .set('username', JSON.parse(userResponse.text)?.user?.username)
      .expect(201);

    expect(JSON.parse(response.text)?.user?.todos[0]).toMatchObject({
      title: 'test todo',
      deadline: todoDate.toISOString(),
      done: false
    });
    expect(validate(JSON.parse(response.text)?.user?.todos[0]?.id)).toBe(true);
    expect(JSON.parse(response.text)?.user?.todos[0]?.created_at).toBeTruthy();
  });

  it('should be able to update a todo', async () => {
    const userResponse = await request(app)
      .post('/users')
      .send({
        name: 'John Doe',
        username: 'user7'
      });

    const todoDate = new Date();

    const todoResponse = await request(app)
      .post('/todos')
      .send({
        title: 'test todo',
        deadline: todoDate
      })
      .set('username', JSON.parse(userResponse.text)?.user?.username);

    const response = await request(app)
      .put(`/todos/${JSON.parse(todoResponse.text)?.user?.todos[0]?.id}`)
      .send({
        title: 'update title',
        deadline: todoDate
      })
      .set('username', JSON.parse(userResponse.text)?.user?.username);

    expect(JSON.parse(response.text)?.user?.todos[0]).toMatchObject({
      title: 'update title',
      deadline: todoDate.toISOString(),
      done: false
    });
  });

  it('should not be able to update a non existing todo', async () => {
    const userResponse = await request(app)
      .post('/users')
      .send({
        name: 'John Doe',
        username: 'user8'
      });

    const todoDate = new Date();

    const response = await request(app)
      .put('/todos/invalid-todo-id')
      .send({
        title: 'update title',
        deadline: todoDate
      })
      .set('username', JSON.parse(userResponse.text)?.user?.username)
      .expect(404);

    expect(response.body.error).toBeTruthy();
  });

  it('should be able to mark a todo as done', async () => {
    const userResponse = await request(app)
      .post('/users')
      .send({
        name: 'John Doe',
        username: 'user3'
      });

    const todoDate = new Date();

    const todoResponse = await request(app)
      .post('/todos')
      .send({
        title: 'test todo',
        deadline: todoDate
      })
      .set('username', JSON.parse(userResponse.text)?.user?.username);

    const response = await request(app)
      .patch(`/todos/${JSON.parse(todoResponse.text)?.user?.todos[0]?.id}/done`)
      .set('username', JSON.parse(userResponse.text)?.user?.username);

    expect(JSON.parse(response.text)?.user?.todos[0]).toMatchObject({
      ...JSON.parse(response.text)?.user?.todos[0],
      done: true
    });
  });

  it('should not be able to mark a non existing todo as done', async () => {
    const userResponse = await request(app)
      .post('/users')
      .send({
        name: 'John Doe',
        username: 'user4'
      });

    const response = await request(app)
      .patch('/todos/invalid-todo-id/done')
      .set('username', userResponse.body.username)
      .expect(404);

    expect(response.body.error).toBeTruthy();
  });

  it('should be able to delete a todo', async () => {
    const userResponse = await request(app)
      .post('/users')
      .send({
        name: 'John Doe',
        username: 'user5'
      });

    const todoDate = new Date();

    const todo1Response = await request(app)
      .post('/todos')
      .send({
        title: 'test todo',
        deadline: todoDate
      })
      .set('username', JSON.parse(userResponse.text)?.user?.username);

    await request(app)
      .delete(`/todos/${JSON.parse(todo1Response.text)?.user?.todos[0]?.id}`)
      .set('username', JSON.parse(userResponse.text)?.user?.username)
      .expect(204);

    const listResponse = await request(app)
      .get('/todos')
      .set('username', JSON.parse(userResponse.text)?.user?.username);

    expect(JSON.parse(listResponse.text)?.todos).toEqual([]);
  });

  it('should not be able to delete a non existing todo', async () => {
    const userResponse = await request(app)
      .post('/users')
      .send({
        name: 'John Doe',
        username: 'user6'
      });

    const response = await request(app)
      .delete('/todos/invalid-todo-id')
      .set('username', JSON.parse(userResponse.text)?.user?.username)
      .expect(404);

    expect(response.body.error).toBeTruthy();
  });
});