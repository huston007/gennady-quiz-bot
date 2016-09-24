require('./chai-setup');
const sinon = require('sinon');

const Game = require('../lib/the-game');

const HINTS_DELAY = 10000;
const NEW_QUESTION_DELAY = 5000;
const MESSAGE_TYPING_DELAY = 1000;

describe('The Game', function () {
  let fakeBot;
    let fakeQuestions = [
      {question: 'foo', answer: 'bar'},
      {question: 'foo', answer: 'bar'},
      {question: 'foo', answer: 'bar'},
      {question: 'foo', answer: 'bar'}
    ];
  let fakeChat = {
    id: 'fake-chag-id'
  };
  let clock;

  const createGame = () => (new Game(fakeBot, fakeChat, fakeQuestions));

  beforeEach(() => {
    fakeBot = {
      sendMessage: sinon.stub().returns(Promise.resolve()),
      sendChatAction: sinon.stub().returns(Promise.resolve())
    };
    this.sinon = sinon.sandbox.create();
    clock = this.sinon.useFakeTimers();
  });

  afterEach(() => this.sinon.restore());

  it('should include', () => Game.should.be.defined);

  it('should create instance', () => createGame().should.be.defined);

  it('should start the game', () => {
    const game = createGame();

    game.start(3);

    game.numberOfQuestions.should.equal(3);
    game.status.should.equal(Game.STATUS.INPROGRESS);
  });

  it('should send question', () => {
    const game = createGame();
    this.sinon.stub(game, 'send').returns(Promise.resolve());
    game.start(3);
    game.sendNewQuestion();

    game.send.should.have.been.calledWith('1. foo');
  });

  it('should ignore /skip after game finish', () => {
    const game = createGame();
    game.start(3);
    game.end();

    this.sinon.stub(game, 'sendNewQuestion');

    game.skip();

    game.sendNewQuestion.should.not.have.been.called;
  });

  it('should accept correct answers', () => {
    const game = createGame();
    this.sinon.stub(game, 'replyOn').returns(Promise.resolve());
    game.start(3);
    game.setCurrentPlayer({id: 'player'});
    game.sendNewQuestion();

    game.checkAnswer({text: fakeQuestions[0].answer});

    game.currentPlayer.score.should.equal(1);
    game.replyOn.should.have.been.called;
  });

  it('should not accept answers after one correct answer', () => {
    const game = createGame();
    game.start(3);
    game.setCurrentPlayer({id: 'player'});
    game.sendNewQuestion();

    game.checkAnswer({text: fakeQuestions[0].answer});
    game.checkAnswer({text: fakeQuestions[0].answer});

    game.currentPlayer.score.should.equal(1);
  });

  it('should send question after delay', () => {
    const game = createGame();
    this.sinon.stub(game, 'sendNewQuestion');
    game.sendNewQuestionAfterDelay();
    clock.tick(NEW_QUESTION_DELAY);

    game.sendNewQuestion.should.have.been.called;
  });

  it('should generate the first ****-like hint', () => {
    const game = createGame();
    this.sinon.stub(game, 'send').returns(Promise.resolve());
    game.runHintsSequence(fakeQuestions[0]);

    game.currentHint.should.equal('');

    clock.tick(HINTS_DELAY + 1000);

    game.currentHint.should.equal('•••');
    game.send.should.have.been.calledWith('Подсказка: •••');
  });

  it('should present winners sorted by score', () => {
    const game = createGame();
    game.start(4);

    game.setCurrentPlayer({id: 'player1', username: 'player1'});
    game.sendNewQuestion();
    game.checkAnswer({text: fakeQuestions[0].answer});
    game.sendNewQuestion();
    game.checkAnswer({text: fakeQuestions[0].answer});
    game.sendNewQuestion();
    game.checkAnswer({text: fakeQuestions[0].answer});

    game.setCurrentPlayer({id: 'player2', username: 'player2'});

    game.setCurrentPlayer({id: 'player3', username: 'player3'});
    game.sendNewQuestion();
    game.checkAnswer({text: fakeQuestions[0].answer});

    this.sinon.stub(game, 'send').returns(Promise.resolve());
    game.sendNewQuestion();

    game.send.should.have.been.calledWith(`🎉🎊💋\n\n@player1: 3 очков\n@player3: 1 очков\n@player2: 0 очков\n\n`);
  });
});
