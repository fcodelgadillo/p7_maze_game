// object destructuring from Matter.js to get the objects to work with
const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

// Maze dimensions
const cellsHorizontals = 15;
const cellsVerticals = 10;
const width = window.innerWidth;
const height = window.innerHeight;

// measure of a grid unit
const unitLengthX = width / cellsHorizontals;
const unitLengthY = height / cellsVerticals;

// create an Engine object, world object, Render object, and configure the screen
const engine = Engine.create();
engine.world.gravity.y = 0;
const { world } = engine;
const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        wireframes: false,
        width,
        height
    }
});

// prepare to render and run the app
Render.run(render);
Runner.run(Runner.create(), engine);


// Walls (some rectangles to prevent shapes from scape our world)
const walls = [
    Bodies.rectangle(width / 2, 0, width, 2, { isStatic: true}),
    Bodies.rectangle(width / 2, height, width, 2, {isStatic: true}),
    Bodies.rectangle(0, height / 2, 2, height, {isStatic: true}),
    Bodies.rectangle(width, height / 2, 2, height, {isStatic: true})
];

// add wall shapes to our world
World.add(world, walls);

// Maze generation

// This function will shuffle an array
const shuffle = (arr) => {
  let counter = arr.length;

  while (counter > 0) {
      const index = Math.floor(Math.random() * counter);
      counter--;
      const temp = arr[counter];
      arr[counter] = arr[index];
      arr[index] = temp;
  }
  return arr;
};

// build a grid with the size of the maze cells
const grid = Array(cellsVerticals)
    .fill(null)
    .map(() => Array(cellsHorizontals).fill(false));

// An array to keep track of vertical wall lines in the maze
const verticals = Array(cellsVerticals)
    .fill(null)
    .map(() => Array(cellsHorizontals - 1).fill(false));

// An array to keep track of horizontals wall lines in the maze
const horizontals = Array(cellsVerticals - 1)
    .fill(null)
    .map(() => Array(cellsHorizontals).fill(false));

// randomize a starting point in the grid to generate the maze
const startRow = Math.floor(Math.random() * cellsVerticals);
const startColumn = Math.floor(Math.random() * cellsHorizontals);

// algorithm to generate a random maze by deleting walls in the grid
const mazeMoving = (row, column) => {
    // if I have visited the cell at [row, column], then return
    if (grid[row][column]) {
        return;
    }

    // mark the cell as visited
    grid[row][column] = true;

    // Assemble randomly-ordered list of neighbors
    const neighbors = shuffle([
        [row - 1, column, 'up'],
        [row, column + 1, 'right'],
        [row + 1, column, 'down'],
        [row, column - 1, 'left']
    ]);


    // For each neighbor...
    for (let neighbor of neighbors) {

        const [nextRow, nextColumn, direction] = neighbor;
        // See if neighbor is out of bounds

        if (
            nextRow < 0 ||
            nextRow >= cellsVerticals ||
            nextColumn < 0 ||
            nextColumn >= cellsHorizontals)
        {
            continue;
        }
        // if we have visited that neighbor, continue to the next
        if(grid[nextRow][nextColumn]) {
            continue;
        }

        // remove wall from either horizontal or vertical
        if(direction === 'left') {
            verticals[row][column - 1] = true;
        } else if (direction === 'right') {
            verticals[row][column] = true;
        } else if(direction === 'up') {
            horizontals[row - 1][column] = true;
        } else if (direction === 'down') {
            horizontals[row][column] = true;
        }

        // if checks passed visit the next cell
        mazeMoving(nextRow, nextColumn)
    }
};

mazeMoving(startRow, startColumn);

// Draw the proper horizontal lines by getting the coordinates of mid points
horizontals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
        if (open) {
            return;
        }

        const wall = Bodies.rectangle(
            columnIndex * unitLengthX + unitLengthX / 2,
            rowIndex * unitLengthY + unitLengthY,
            unitLengthX,
            5,
            {
                label: 'wall',
                isStatic: true,
                render: {
                    fillStyle: 'blue'
                }
            }
        );
        World.add(world, wall);
    });
});

// Draw the vertical lines by getting the coordinates of mid points
verticals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
        if (open) {
            return;
        }

        const wall = Bodies.rectangle(
            columnIndex * unitLengthX + unitLengthX,
            rowIndex * unitLengthY + unitLengthY / 2,
            5,
            unitLengthY,
            {
                label: 'wall',
                isStatic: true,
                render: {
                    fillStyle: 'red'
                }
            }
        );
        World.add(world, wall);
    });
});


// Drawing the goal place
const goal = Bodies.rectangle(
    width - unitLengthX / 2,
    height - unitLengthY / 2,
    unitLengthX * 0.7,
    unitLengthY * 0.7,
    {
        label: 'goal',
        isStatic: true,
        render: {
            fillStyle: 'green'
        }
    }
);

World.add(world, goal);

// Drawing the ball to play
const ballRadius = Math.min(unitLengthX, unitLengthY) / 4;
const ball = Bodies.circle(
    unitLengthX / 2,
    unitLengthY / 2,
    ballRadius,
    {
        label: 'ball',
        render: {
            fillStyle: 'yellow'
        }
    }
);

World.add(world, ball);

// ball control
document.addEventListener('keydown', event => {
   const { x, y } = ball.velocity;

   // moving the ball up
    if (event.keyCode === 38) {
        Body.setVelocity(ball, {x: x, y: y - 5});
   }

    // moving the ball right
    if (event.keyCode === 39) {
        Body.setVelocity(ball, {x: x + 5, y: y});
    }

    // moving the ball down
    if (event.keyCode === 40) {
        Body.setVelocity(ball, {x: x, y: y + 5})
    }

    // moving the ball left
    if (event.keyCode === 37) {
        Body.setVelocity(ball, {x: x - 5, y: y});
    }
});

// setting the win condition
Events.on(engine, 'collisionStart', event => {
    event.pairs.forEach((collision) => {
        const labels = ['ball', 'goal'];

        if (
            labels.includes(collision.bodyA.label) &&
            labels.includes(collision.bodyB.label)
        ) {
            document.querySelector('.winner').classList.remove('hidden');
            world.gravity.y = 1;
            world.bodies.forEach(body => {
                if (body.label === 'wall') {
                    Body.setStatic(body, false);
                }
            });
        }
    });
});
