import React, { Component } from 'react';
import io from 'socket.io-client';
import './App.css';

const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 512;
const TILE_WIDTH = 64;
const TILE_HEIGHT = 64;

class Player {
  constructor(ctx, game) {
    this.ctx = ctx;
    this.game = game;
    // server override ediyor
    this.health = 100;
    this.isDead = false;
    this.id = 0;
    this.x = -100;
    this.y = -100;
    this.type = 0;
    this.inventory = [];
  };

  drawSelf = () => {
    const x = CANVAS_WIDTH / 2 - 32;
    const y = CANVAS_HEIGHT / 2 - 32;

    if (!this.isDead) {
      this.ctx.drawImage(
        // TODO user0 > use type to show different skins
        this.game.images.users[this.type], 0, 0, TILE_WIDTH, TILE_HEIGHT,
        x, y,
        TILE_WIDTH, TILE_HEIGHT);

      // RENDER HEALTH BAR
      this.ctx.font = '16px comic sans';
      this.ctx.fillStyle = 'black';
      this.ctx.textAlign = "center";
      this.ctx.fillText(this.name, x + TILE_WIDTH / 2, y + 10);

      this.ctx.fillStyle = 'red';
      this.ctx.fillRect(x + 16, y + 50, 32, 12)
      this.ctx.fillStyle = 'lightgreen';
      this.ctx.fillRect(x + 16 + 2, y + 52, 28 * (this.health / 100), 8)
      // RENDER İNVENTORY
      this.ctx.font = '15px comic sans';
      this.ctx.fillStyle = 'black';
      this.ctx.textAlign = "center";
      if (this.inventory !== []) {
        this.inventory.forEach((i, key) => {
          this.ctx.fillText(
            `${i.name} ${i.amount}`
          , (CANVAS_WIDTH / 2) - (key * 10), CANVAS_HEIGHT - 20);
        })
      }
    }
    /*
      this.ctx.font = '14px arial';
      this.ctx.fillStyle = 'white';
      this.ctx.textAlign = "left";
      this.ctx.fillText(`BAKIYE: ₺${this.coins}`, 20, CANVAS_HEIGHT - 20);
      this.ctx.fillText(`MEDKITS: ${this.medkits}`, 20, CANVAS_HEIGHT - 40);
    */
  };

  draw = () => {
    const currentPlayer = this.game.players.find(player => player.id === this.game.socket.id);
    if (currentPlayer.id === this.id) {
      return this.drawSelf();
    }

    if (!this.isDead) {
      const x = (CANVAS_WIDTH / 2 - 32) + (this.x - currentPlayer.x)
      const y = (CANVAS_HEIGHT / 2 - 32) + (this.y - currentPlayer.y)
      this.ctx.drawImage(
        // TODO user0 > use type to show different skins
        this.game.images.users[this.type], 0, 0, TILE_WIDTH, TILE_HEIGHT,
        x,
        y,
        TILE_WIDTH, TILE_HEIGHT);

      // RENDER HEALTH BAR
      this.ctx.font = '18px comic sans';
      this.ctx.fillStyle = 'black';
      this.ctx.textAlign = "center";
      this.ctx.fillText(this.name, x + TILE_WIDTH / 2, y + 10);

      this.ctx.fillStyle = 'lightred';
      this.ctx.fillRect(x + 16, y + 50, 32, 12)
      this.ctx.fillStyle = 'lightyellow';
      this.ctx.fillRect(x + 16 + 2, y + 52, 28 * (this.health / 100), 8)
      //
    }
  };
};

class Game {
  constructor(ctx, socket) {
    console.log('init');
    this.socket = socket;
    this.ctx = ctx;
    this.images = {
        tiles: {},
        images: {},
    };
    this.players = [];
    this.layers = [];

    socket.on('PLAYERS_UPDATE', (players) => {
      const newPlayers = [];
      for (var i = 0; i < players.length; i++) {
        const newPlayer = new Player(ctx, this);
        newPlayer.id = players[i].id;
        newPlayer.name = players[i].name;
        newPlayer.health = players[i].health;
        newPlayer.isDead = players[i].isDead;
        newPlayer.x = players[i].x;
        newPlayer.y = players[i].y;
        newPlayer.type = players[i].type;
        newPlayer.inventory = players[i].inventory;
        newPlayers.push(newPlayer);
      }
      this.players = newPlayers;
    });

    socket.on('GAME_STATE_UPDATE', (state) => {
      this.gameOver = state.gameOver;
      this.winnerId = state.winnerId;
    });

    socket.on('LAYERS_UPDATE', layers => {
      this.layers = layers;
    });

    socket.on('LAYER_UPDATE', data => {
      this.layers = data.layers;
    });
  }

  init = async () => {
    console.log('load');
    const tile0 = await this.loadImage('./assets/layers/0.png');
    const tile1 = await this.loadImage('./assets/layers/1.png');
    const tile2 = await this.loadImage('./assets/layers/2.png');
    const tile3 = await this.loadImage('./assets/layers/3.png');
    const tile4 = await this.loadImage('./assets/layers/4.png');
    const tile5 = await this.loadImage('./assets/layers/5.png');
    const tile6 = await this.loadImage('./assets/layers/6.png');
    const tile7 = await this.loadImage('./assets/layers/7.png');
    const tile8 = await this.loadImage('./assets/layers/8.png');
    const tile9 = await this.loadImage('./assets/layers/9.png');
    const user0 = await this.loadImage('./assets/users/0.png');
    const user1 = await this.loadImage('./assets/users/1.png');
    const user2 = await this.loadImage('./assets/users/2.png');
    const user3 = await this.loadImage('./assets/users/3.png');
    this.images = {
      users: {
        0: user0,
        1: user1,
        2: user2,
        3: user3,
      },
      tiles: {
        0: tile0,
        1: tile1,
        2: tile2,
        3: tile3,
        4: tile4,
        5: tile5,
        6: tile6,
        7: tile7,
        8: tile8,
        9: tile9,
      },
    }

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  };

  onKeyDown = event => {
    const keyCode = event.keyCode;
    // LEFT
    if (keyCode === 65) {
      this.socket.emit('PLAYER_DIRECTION_UPDATE', { dirx: -1 });
    }
    // RIGHT
    else if (keyCode === 68) {
      this.socket.emit('PLAYER_DIRECTION_UPDATE', { dirx: 1 });
    }
    // UP
    if (keyCode === 87) {
      this.socket.emit('PLAYER_DIRECTION_UPDATE', { diry: -1 });
    }
    // DOWN
    else if (keyCode === 83) {
      this.socket.emit('PLAYER_DIRECTION_UPDATE', { diry: 1 });
    }
  }

  onKeyUp = event => {
    const keyCode = event.keyCode;
    // LEFT - right
    if (keyCode === 65 || keyCode === 68) {
      this.socket.emit('PLAYER_DIRECTION_UPDATE', { dirx: 0 });
    }
    // UP - down
    if (keyCode === 83 || keyCode === 87) {
      this.socket.emit('PLAYER_DIRECTION_UPDATE', { diry: 0 });
    }
  }

  loadImage = (src) => {
    var img = new Image();
    var d = new Promise(function (resolve, reject) {
        img.onload = function () {
            resolve(img);
        };

        img.onerror = function () {
            reject('Could not load image: ' + src);
        };
    });

    img.src = src;
    return d;
  }

  update = () => {}

  draw = async () => {
    if (this.gameOver) {
      const winner = this.players.find(player => player.id === this.winnerId);
      this.ctx.font = '40px arial';
      this.ctx.fillStyle = 'white';
      this.ctx.textAlign = "center";
      this.ctx.fillText(`KAZANAN: ${winner.name}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
      return;
    }

    this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const currentPlayer = this.players.find(player => player.id === this.socket.id);
    if (currentPlayer) {
      const cameraCornerX = currentPlayer.x - CANVAS_WIDTH / 2;
      const cameraCornerY = currentPlayer.y - CANVAS_HEIGHT / 2;
      const offsetX = currentPlayer.x % TILE_WIDTH;
      const offsetY = currentPlayer.y % TILE_HEIGHT;
      const startTileX = Math.floor(cameraCornerX / TILE_WIDTH) - 1
      const startTileY = Math.floor(cameraCornerY / TILE_HEIGHT) - 1

      const cols = CANVAS_WIDTH / TILE_WIDTH + 2;
      const rows = CANVAS_HEIGHT / TILE_HEIGHT + 2;
      for (var i = 0; i < this.layers.length; i++) {
        const layer = this.layers[i];
        for (var j = 0; j < rows; j++) {
          for (var k = 0; k < cols; k++) {
            let imageType;
            try {
              imageType = startTileX + k >= 0 && startTileY + j >= 0 ? layer[startTileY + j][ startTileX + k] : undefined;
            } catch(err){}

            if (imageType === undefined) {
              this.ctx.fillStyle = 'black';
              this.ctx.fillRect(k * TILE_WIDTH, j * TILE_HEIGHT, TILE_WIDTH, TILE_HEIGHT)
            } else {
              this.ctx.drawImage(
                this.images.tiles[imageType], 0, 0, TILE_WIDTH, TILE_HEIGHT,
                k * TILE_WIDTH - offsetX - 64, j * TILE_HEIGHT - offsetY - 64,
                TILE_WIDTH, TILE_HEIGHT);
            }
          }
        }
      }

      for (var m = 0; m < this.players.length; m++) {
        const player = this.players[m];
        player.draw(cameraCornerX, cameraCornerY);
      }
    }
  }
};


class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      CURRENT_STEP: '',
      isGameRunning: false,
    };
    this.canvasRef = React.createRef();
    this.lastLoop = null;
  }

  start = async () => {
    var socket = io('https://myreactapp7281.herokuapp.com/');
    socket.on('disconnect', () => {
      this.setState({isGameRunning: false});
      setTimeout(window.location.reload, 10000);
    });

    socket.emit('PLAYER_NAME_UPDATE', { name: this.state.name });
    if (!this.state.isGameRunning) {
      this.game = new Game(this.getCtx(), socket);
      await this.game.init();
      this.loop();
    }
    this.setState(state => ({nameEntered: true, isGameRunning: !state.isGameRunning}));
  }

  loop = () => {
    requestAnimationFrame(() => {
      // const now = Date.now();
      // if (now - this.lastLoop > (1000 / 30)) {
      this.game.update();
      this.game.draw();

      this.lastLoop = Date.now();

      if (this.state.isGameRunning) {
        this.loop();
      }
    });
  }

  getCtx = () => this.canvasRef.current.getContext('2d');

  render() {
    if ((typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1)) {
      return 'Uzgunum dostum...';
    }

    return (
      <div style={{height: '100%'}}>
        {!this.state.nameEntered && (
          <div>
            <input type="text" onChange={(evt) => this.setState({name: evt.target.value.substring(0, 6).toLowerCase()})} />
            <button disabled={!this.state.name} onClick={this.start}>START!</button>
          </div>
        )}
        <div style={{height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'black'}}>
          <canvas ref={this.canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT}>
          </canvas>
        </div>
      </div>
    );
  }
}

export default App;
