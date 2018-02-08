const gameGrid = document.getElementById('gameGrid');
const rows = Array.from(document.getElementsByClassName('grid-row'));

console.log('rows', rows);

const cells = rows.map(row => Array.from(row.getElementsByClassName('grid-cell')));

console.log(cells);

class Game {
  constructor(gameGrid, cells) {
    this.gameGrid = gameGrid;
    this.cells = cells;
    this.occupiedCells = [];
    this.initialize();
  }

  getRandomCell(optVal) {
    const getRandomArbitary = (min, max) => Math.floor(Math.random() * (max - min) + min);

    const row = getRandomArbitary(0, 4);
    const cell = getRandomArbitary(0, 4);
    const val = optVal ? optVal : getRandomArbitary(1, 3) * 2;

    const createdCell = { row, cell, val };

    if (this.occupiedCells.find(c => c.row === row && c.cell === cell)) {
      return this.getRandomCell();
    }

    return createdCell;
  }

  initialize() {
    document.addEventListener('keydown', (e) => {
      // e.preventDefault();
      switch(e.keyCode) {
        case 37:
          e.preventDefault();
          this.moveLeft();
          break;
        case 38:
          e.preventDefault();
          this.moveTop();
          break;
        case 39:
          e.preventDefault();
          this.moveRight();
          break;
        case 40:
          e.preventDefault();
          this.moveBottom();
          break;
        default:
          return null;
      }
    })
    // by default one cell should be 2
    this.addCell(this.getRandomCell(2));
    this.addCell(this.getRandomCell());
  }


  addCell(cell) {
    const cellNode = this.drawCell(cell);
    const newCell = { ...cell, node: cellNode };
    this.occupiedCells.push(newCell);
    return newCell;
  }

  drawCell(cell) {
    const animateSize = (e) => {
      cellNode.style.height = `${cellNode.offsetHeight - 15}px`;
      cellNode.style.width = `${cellNode.offsetWidth - 15}px`;

      e.target.removeEventListener('transitionend', animateSize);
    }

    const cellNode = document.createElement('div');
    const cellInnerNode = document.createElement('div');
    cellNode.classList.add('tile');
    cellNode.classList.add(`tile-${cell.val}`);
    cellNode.style.left = `${this.cells[cell.row][cell.cell].offsetLeft}px`;
    cellNode.style.top = `${this.cells[cell.row][cell.cell].offsetTop}px`;
    cellInnerNode.classList.add('tile-inner');
    cellInnerNode.innerText = cell.val;
    cellNode.appendChild(cellInnerNode);
    gameGrid.appendChild(cellNode);

    cellNode.addEventListener('transitionend', animateSize);

    cellNode.style.height = `${cellNode.offsetHeight + 15}px`;
    cellNode.style.width = `${cellNode.offsetWidth + 15}px`;

    return cellNode;
  }

  stackCells(stackedCell, targetCell) {
    const showNewNumberAndDeleteNode = (e) => {
      targetCell.node.style.height = `${targetCell.node.offsetHeight - 15}px`;
      targetCell.node.style.width = `${targetCell.node.offsetWidth - 15}px`;

      e.target.removeEventListener('transitionend', showNewNumberAndDeleteNode);
    };

    stackedCell.node.addEventListener('transitionend', showNewNumberAndDeleteNode);
    stackedCell.node.style.left = `${this.cells[targetCell.row][targetCell.cell].offsetLeft}px`;
    stackedCell.node.style.top = `${this.cells[targetCell.row][targetCell.cell].offsetTop}px`;
    stackedCell.node.style.opacity = 0;

    const indexToDelete = this.occupiedCells.findIndex(c => c.row === stackedCell.row && c.cell === stackedCell.cell);
    stackedCell.node.remove();
    this.occupiedCells.splice(indexToDelete, 1);

    const indexToReplace = this.occupiedCells.findIndex(c => c.row === targetCell.row && c.cell === targetCell.cell);
    targetCell.node.remove();
    this.occupiedCells.splice(indexToReplace, 1);

    return this.addCell({ ...targetCell, val: targetCell.val * 2 });
  }

  moveCell(cell, position) {
    const indexCellToMove = this.occupiedCells.findIndex(c => c.row === cell.row && c.cell === cell.cell);
    const cellToMove = this.occupiedCells[indexCellToMove];
    this.occupiedCells[indexCellToMove] = { ...cellToMove, row: position.row, cell: position.cell };
    this.occupiedCells[indexCellToMove].node.style.left = `${this.cells[position.row][position.cell].offsetLeft}px`;
    this.occupiedCells[indexCellToMove].node.style.top = `${this.cells[position.row][position.cell].offsetTop}px`;
  }

  performActions(actions) {
    console.log('actions', actions);
    actions.stack.forEach((action) => this.stackCells(action.toStack, action.target));
    actions.move.forEach((action) => this.moveCell(action.cell, action.coordinates));
    if (actions.move.length > 0 || actions.stack.length > 0) {
      this.addCell(this.getRandomCell());
    }
  }

  moveLeft() {
    console.log('moveLeft');
    const actionsOnThisTurn = {
      stack: [],
      move: [],
    };

    this.cells.forEach((cellsRow, index) => {
      const actionsInThisRow = {
        stack: [],
        move: [],
      };
      const findEmptySpace = (cellToMove, row) => {
        const cellsBeforeCurrent = row.filter(c => c.cell < cellToMove.cell);
        const indexToMove = cellsBeforeCurrent.reduce((acc, cur) => cur.cell + 1, 0);
        return indexToMove;
      }
      const occupiedInThisRow = this.occupiedCells.filter(c => c.row === index);
      const occupiedCellsIndexes = occupiedInThisRow.map(c => c.cell);
      occupiedCellsIndexes.sort((a, b) => b - a);

      if (occupiedInThisRow.length === 1 && occupiedCellsIndexes[0] !== 0) {
        actionsInThisRow.move.push({ cell: occupiedInThisRow[0], coordinates: { row: index, cell: 0 } });
      }

      if (occupiedInThisRow.length > 1) {
        const shouldStack = [];
        const shouldMove = [];
        occupiedInThisRow.forEach((occupiedCell) => {
          const itemsOnLefthandSide = []
          occupiedInThisRow.forEach((occupiedInnerCell) => {
            if (occupiedCell.cell < occupiedInnerCell.cell) {
              if (occupiedCell.val === occupiedInnerCell.val) {
                const cellsBetween = occupiedInThisRow.filter(c => c.cell < occupiedInnerCell.cell && c.cell > occupiedCell.cell);

                if (cellsBetween.length === 0) {
                  actionsInThisRow.stack.push({ target: occupiedCell, toStack: occupiedInnerCell });
                  shouldStack.push(occupiedInnerCell);
                }
              }
            }

            if (occupiedCell.cell > occupiedInnerCell.cell && !shouldStack.includes(occupiedInnerCell)) {
              itemsOnLefthandSide.push(occupiedInnerCell);
            }
          });

          itemsOnLefthandSide.sort((a, b) => b.cell - a.cell);

          if (occupiedCell.cell !== 0) {
            if (itemsOnLefthandSide.length > 0) {
              if (occupiedCell.cell - itemsOnLefthandSide[0].cell > 1) {
                let cellToMove = itemsOnLefthandSide[0].cell + 1;
                const indexLeftNeighbor = shouldMove.findIndex(c => c.from === itemsOnLefthandSide[0].cell);
                if (indexLeftNeighbor !== -1) {
                  cellToMove = shouldMove[indexLeftNeighbor].to + 1;
                }
                actionsInThisRow.move.push({ cell: occupiedCell, coordinates: { row: index, cell: cellToMove } });
                shouldMove.push({ from: occupiedCell.cell, to: itemsOnLefthandSide[0].cell + 1 });
              }
            } else {
              actionsInThisRow.move.push({ cell: occupiedCell, coordinates: { row: index, cell: 0 } });
            }
          }

        });
        console.log('occupiedInThisRow', occupiedInThisRow)
      }

      actionsOnThisTurn.stack = [...actionsOnThisTurn.stack, ...actionsInThisRow.stack];
      actionsOnThisTurn.move = [...actionsOnThisTurn.move, ...actionsInThisRow.move];
    });
    this.performActions(actionsOnThisTurn);
  }

  moveRight() {
    console.log('moveRight');

    const actionsOnThisTurn = {
      stack: [],
      move: [],
    };

    this.cells.forEach((cellsRow, index) => {
      const actionsInThisRow = {
        stack: [],
        move: [],
      };

      const occupiedInThisRow = this.occupiedCells.filter(c => c.row === index);
      const occupiedCellsIndexes = occupiedInThisRow.map(c => c.cell);
      occupiedCellsIndexes.sort();


      if (occupiedCellsIndexes.length === 1 && occupiedCellsIndexes[0] !== 3) {
        actionsInThisRow.move.push({ cell: occupiedInThisRow[0], coordinates: { row: index, cell: 3 } });
      }

      // if (occupiedInThisRow.length > 1) {
      //   const shouldStack = [];
      //   const shouldMove = [];
      //   occupiedInThisRow.sort((a, b) => b.cell - a.cell);
      //   occupiedInThisRow.forEach((occupiedCell) => {
      //     const itemsOnRighthandSide = []
      //     occupiedInThisRow.forEach((occupiedInnerCell) => {
      //       if (occupiedCell.cell > occupiedInnerCell.cell) {
      //         if (occupiedCell.val === occupiedInnerCell.val) {
      //           const cellsBetween = occupiedInThisRow.filter(c => c.cell > occupiedInnerCell.cell && c.cell < occupiedCell.cell);

      //           if (cellsBetween.length === 0) {
      //             actionsInThisRow.stack.push({ target: occupiedCell, toStack: occupiedInnerCell });
      //             shouldStack.push(occupiedInnerCell);
      //           }
      //         }
      //       }

      //       if (occupiedCell.cell < occupiedInnerCell.cell && !shouldStack.includes(occupiedInnerCell)) {
      //         itemsOnRighthandSide.push(occupiedInnerCell);
      //       }
      //     });

      //     itemsOnRighthandSide.sort();

      //     console.log('itemsOnRighthandSide', itemsOnRighthandSide);

      //     if (occupiedCell.cell !== 3) {
      //       if (itemsOnRighthandSide.length > 0) {
      //         if (itemsOnRighthandSide[0].cell - occupiedCell.cell > 1) {
      //           let cellToMove = itemsOnRighthandSide[0].cell - 1;
      //           const indexRightNeighbor = shouldMove.findIndex(c => c.from === itemsOnRighthandSide[0].cell);
      //           if (indexRightNeighbor !== -1) {
      //             cellToMove = shouldMove[indexRightNeighbor].to - 1;
      //           }
      //           actionsInThisRow.move.push({ cell: occupiedCell, coordinates: { row: index, cell: cellToMove } });
      //           shouldMove.push({ from: occupiedCell.cell, to: itemsOnRighthandSide[0].cell - 1 });
      //         }
      //       } else {
      //         actionsInThisRow.move.push({ cell: occupiedCell, coordinates: { row: index, cell: 3 } });
      //       }
      //     }

      //   });
      //   console.log('occupiedInThisRow', occupiedInThisRow)
      // }

      actionsOnThisTurn.stack = [...actionsOnThisTurn.stack, ...actionsInThisRow.stack];
      actionsOnThisTurn.move = [...actionsOnThisTurn.move, ...actionsInThisRow.move];
    });

    this.performActions(actionsOnThisTurn);
  }

  moveTop() {
    console.log('moveTop');
    const columns = [];
    this.cells.forEach((row) => {
      row.forEach((c, i) => {
        if (!columns[i]) {
          columns[i] = [];
        }

        columns[i].push(c);
      });
    });

    columns.forEach((column, index) => {
      const occupiedInThisColumn = this.occupiedCells.filter(c => c.cell === index);
      const occupiedColumnIndexes = occupiedInThisColumn.map(c => c.row);

      occupiedColumnIndexes.sort((a, b) => b - a);

      if (occupiedColumnIndexes.length === 1 && occupiedColumnIndexes[0] !== 0) {
        this.moveCell(occupiedInThisColumn[0], { row: 0, cell: index });
      }

    });
  }

  moveBottom() {
    console.log('moveBottom');
    const columns = [];
    this.cells.forEach((row) => {
      row.forEach((c, i) => {
        if (!columns[i]) {
          columns[i] = [];
        }

        columns[i].push(c);
      });
    });

    columns.forEach((column, index) => {
      const occupiedInThisColumn = this.occupiedCells.filter(c => c.cell === index);
      const occupiedColumnIndexes = occupiedInThisColumn.map(c => c.row);

      occupiedColumnIndexes.sort();

      if (occupiedColumnIndexes.length === 1 && occupiedColumnIndexes[0] !== 3) {
        this.moveCell(occupiedInThisColumn[0], { row: 3, cell: index });
      }

    });
  }

}

const game = new Game(gameGrid, cells);
