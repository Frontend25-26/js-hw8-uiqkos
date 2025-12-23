const board = document.getElementById("board");
let selectedPiece = null;
let currentPlayer = "white";
let gameOver = false;

function createBoard() {
    for (let i = 0; i < 8; i++) {
        const row = document.createElement("div");
        row.classList.add("row");
        for (let j = 0; j < 8; j++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            cell.classList.add((i + j) % 2 === 0 ? "white" : "black");
            cell.dataset.i = i;
            cell.dataset.j = j;

            if (i < 3 && (i + j) % 2 !== 0) {
                addPiece(cell, "black", i, j);
            } else if (i > 4 && (i + j) % 2 !== 0) {
                addPiece(cell, "white", i, j);
            }
            row.appendChild(cell);
        }
        board.appendChild(row);
    }
}

function addPiece(cell, color, row, col) {
    const piece = document.createElement("div");
    piece.classList.add("piece", color);
    piece.dataset.color = color;
    piece.dataset.col = col;
    piece.dataset.row = row;
    cell.appendChild(piece);
}

function getCellAt(row, col) {
    if (row < 0 || row > 7 || col < 0 || col > 7) return null;
    return document.querySelector(`.cell[data-i="${row}"][data-j="${col}"]`);
}

function getPieceAt(row, col) {
    const cell = getCellAt(row, col);
    return cell ? cell.querySelector('.piece') : null;
}

function getAvailableMoves(piece) {
    const row = parseInt(piece.dataset.row);
    const col = parseInt(piece.dataset.col);
    const color = piece.dataset.color;
    const direction = color === "white" ? -1 : 1;
    const moves = [];

    const regularMoves = [
        { row: row + direction, col: col - 1 },
        { row: row + direction, col: col + 1 }
    ];

    regularMoves.forEach(move => {
        if (move.row >= 0 && move.row <= 7 && move.col >= 0 && move.col <= 7) {
            const targetPiece = getPieceAt(move.row, move.col);
            if (!targetPiece) {
                moves.push({ row: move.row, col: move.col, capture: null });
            }
        }
    });

    const captureMoves = [
        { row: row + 2 * direction, col: col - 2, captureRow: row + direction, captureCol: col - 1 },
        { row: row + 2 * direction, col: col + 2, captureRow: row + direction, captureCol: col + 1 }
    ];

    captureMoves.forEach(move => {
        if (move.row >= 0 && move.row <= 7 && move.col >= 0 && move.col <= 7) {
            const capturedPiece = getPieceAt(move.captureRow, move.captureCol);
            const targetPiece = getPieceAt(move.row, move.col);
            if (capturedPiece && capturedPiece.dataset.color !== color && !targetPiece) {
                moves.push({
                    row: move.row,
                    col: move.col,
                    capture: { row: move.captureRow, col: move.captureCol }
                });
            }
        }
    });

    return moves;
}

function highlightAvailableMoves(moves) {
    clearHighlights();
    moves.forEach(move => {
        const cell = getCellAt(move.row, move.col);
        if (cell) {
            cell.classList.add('available');
            cell.dataset.moveRow = move.row;
            cell.dataset.moveCol = move.col;
            if (move.capture) {
                cell.dataset.captureRow = move.capture.row;
                cell.dataset.captureCol = move.capture.col;
            }
        }
    });
}

function clearHighlights() {
    document.querySelectorAll('.cell.available').forEach(cell => {
        cell.classList.remove('available');
        delete cell.dataset.moveRow;
        delete cell.dataset.moveCol;
        delete cell.dataset.captureRow;
        delete cell.dataset.captureCol;
    });
}

function movePiece(piece, newRow, newCol) {
    const oldRect = piece.getBoundingClientRect();

    piece.dataset.row = newRow;
    piece.dataset.col = newCol;

    const oldCell = piece.parentElement;
    const newCell = getCellAt(newRow, newCol);
    if (newCell && oldCell !== newCell) {
        newCell.appendChild(piece);
    }

    const newRect = piece.getBoundingClientRect();
    const deltaX = oldRect.left - newRect.left;
    const deltaY = oldRect.top - newRect.top;

    piece.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    piece.style.transition = 'none';

    requestAnimationFrame(() => {
        piece.style.transition = 'transform 0.3s ease';
        piece.style.transform = '';
    });
}

function capturePiece(row, col) {
    const piece = getPieceAt(row, col);
    if (piece) {
        piece.classList.add('captured');
        setTimeout(() => {
            piece.remove();
            checkWinner();
        }, 500);
    }
}

function checkWinner() {
    const whitePieces = document.querySelectorAll('.piece.white').length;
    const blackPieces = document.querySelectorAll('.piece.black').length;

    if (whitePieces === 0) {
        showWinner('Чёрные');
    } else if (blackPieces === 0) {
        showWinner('Белые');
    }
}

function showWinner(winner) {
    if (gameOver) return;
    gameOver = true;

    const notification = document.createElement('div');
    notification.classList.add('winner-notification');
    notification.textContent = `${winner} победили!`;
    document.body.appendChild(notification);
}

board.addEventListener('click', (e) => {
    if (gameOver) return;

    const clickedPiece = e.target.closest('.piece');
    const clickedCell = e.target.closest('.cell');

    if (clickedPiece && clickedPiece.dataset.color === currentPlayer) {
        if (selectedPiece) {
            selectedPiece.classList.remove('selected');
        }
        selectedPiece = clickedPiece;
        selectedPiece.classList.add('selected');
        const moves = getAvailableMoves(selectedPiece);
        highlightAvailableMoves(moves);
    } else if (clickedCell && clickedCell.classList.contains('available') && selectedPiece) {
        const newRow = parseInt(clickedCell.dataset.moveRow);
        const newCol = parseInt(clickedCell.dataset.moveCol);
        const captureRow = clickedCell.dataset.captureRow;
        const captureCol = clickedCell.dataset.captureCol;

        movePiece(selectedPiece, newRow, newCol);

        if (captureRow !== undefined && captureCol !== undefined) {
            capturePiece(parseInt(captureRow), parseInt(captureCol));
        }

        selectedPiece.classList.remove('selected');
        selectedPiece = null;
        clearHighlights();
        currentPlayer = currentPlayer === "white" ? "black" : "white";
    } else {
        if (selectedPiece) {
            selectedPiece.classList.remove('selected');
            selectedPiece = null;
        }
        clearHighlights();
    }
});

createBoard();
