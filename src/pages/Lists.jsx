import { Link } from 'react-router-dom';

export default function Lists() {
  return (
    <>

      <div className="lists-container">
        <div className="page-header">
          <h1>Lists</h1>
          <p className="page-subtitle">Organize your thoughts with flexible lists</p>
        </div>

        <div className="lists-toolbar">
          <button id="add-list-btn" className="toolbar-btn primary">
            <i className="fas fa-plus"></i>
            <span>New List</span>
          </button>
        </div>

        <div id="lists-grid" className="lists-grid"></div>
      </div>
    
    </>
  );
}
